const DEFAULT_TIMEOUT_MS = 60000;
const MAX_REPLY_LENGTH = 3500;

const PROVIDERS = {
    vikey: {
        name: "Vikey",
        url: "https://api.vikey.ai/v1/chat/completions",
        model: "vikey/vclaw",
        env: "VIKEY_API_KEY",
        stream: false,
    },
    mimo: {
        name: "Mimo",
        url: "https://mimo.lokerin.net/v1/chat/completions",
        model: "cutad-agent-pro",
        env: "MIMO_API_KEY",
        stream: true,
    },
    bynara: {
        name: "Bynara",
        url: "https://router.bynara.id/v1/chat/completions",
        model: "mistral-large",
        env: "BYNARA_API_KEY",
        stream: false,
    },
};

function getProviderKeys() {
    return Object.keys(PROVIDERS);
}

function trimReply(text) {
    const value = String(text || "").trim();

    if (!value) return "AI tidak mengirim jawaban.";
    if (value.length <= MAX_REPLY_LENGTH) return value;

    return `${value.slice(0, MAX_REPLY_LENGTH)}\n\n...jawaban dipotong karena terlalu panjang.`;
}

function getQuotedText(m) {
    return String(m.quoted?.text || m.quoted?.caption || "").trim();
}

function parseInput(text, m) {
    const parts = String(text || "").trim().split(/\s+/).filter(Boolean);
    const providerKey = parts[0]?.toLowerCase();

    if (PROVIDERS[providerKey]) {
        return {
            providerKey,
            prompt: parts.slice(1).join(" ").trim() || getQuotedText(m),
        };
    }

    return {
        providerKey: "",
        prompt: String(text || "").trim() || getQuotedText(m),
    };
}

function selectProvider(providerKey) {
    if (providerKey) return PROVIDERS[providerKey];

    return getProviderKeys()
        .map((key) => PROVIDERS[key])
        .find((provider) => process.env[provider.env]) || PROVIDERS.vikey;
}

function getApiKey(provider) {
    return process.env[provider.env] || "";
}

function createPayload(provider, prompt) {
    return {
        model: provider.model,
        messages: [
            {
                role: "system",
                content: "Jawab dalam bahasa Indonesia yang jelas, ringkas, dan membantu.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        ...(provider.stream ? { stream: true } : {}),
    };
}

function readJsonReply(data) {
    return data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.message?.content ||
        data?.content ||
        "";
}

async function readStreamReply(response) {
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = "";
    let answer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
            const clean = line.trim();
            if (!clean.startsWith("data:")) continue;

            const payload = clean.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
                const data = JSON.parse(payload);
                answer += data?.choices?.[0]?.delta?.content ||
                    data?.choices?.[0]?.message?.content ||
                    data?.choices?.[0]?.text ||
                    "";
            } catch (error) {
                answer += payload;
            }
        }
    }

    return answer;
}

async function askAi(provider, apiKey, prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
        const response = await fetch(provider.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(createPayload(provider, prompt)),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(`API ${provider.name} gagal (${response.status}): ${errorText.slice(0, 500)}`);
        }

        if (provider.stream && response.body) {
            return readStreamReply(response);
        }

        const data = await response.json();
        return readJsonReply(data);
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    name: "ai",
    commands: ["ai", "ask", "gpt"],
    category: "AI",
    description: "Chat AI dengan provider Vikey, Mimo, atau Bynara.",
    async execute({ m, text }) {
        const { providerKey, prompt } = parseInput(text, m);
        const provider = selectProvider(providerKey);
        const apiKey = getApiKey(provider);

        if (!apiKey) {
            await m.reply([
                `API key ${provider.name} belum diatur.`,
                `Tambahkan environment variable: ${provider.env}`,
                "",
                "Provider tersedia:",
                getProviderKeys().map((key) => `- ${key}`).join("\n"),
            ].join("\n"));
            return;
        }

        if (!prompt) {
            await m.reply([
                "Gunakan:",
                ".ai pertanyaan kamu",
                ".ai vikey pertanyaan kamu",
                ".ai mimo pertanyaan kamu",
                ".ai bynara pertanyaan kamu",
                "",
                "Bisa juga reply pesan lalu ketik .ai",
            ].join("\n"));
            return;
        }

        try {
            await m.reply(`AI ${provider.name} sedang berpikir...`);
            const answer = await askAi(provider, apiKey, prompt);
            await m.reply(trimReply(answer));
        } catch (error) {
            console.error("AI feature error:", error);
            await m.reply(`Gagal menjalankan AI ${provider.name}: ${error.message}`);
        }
    },
};
