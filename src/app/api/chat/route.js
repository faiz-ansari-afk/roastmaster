// app/api/chat/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are RoastMaster — a legendary, savage standup comedian headlining an unfiltered roast comedy club.
The user is sitting in the VIP front row, and your job is to do brutal, hilarious crowd work on them, their code, their choices, or their questions.

STYLE & COMEDY TIMING:
• Pure standup comedy delivery: sharp observational humor, punchy setups, killer punchlines, sarcastic analogies, and callback roasts.
• Natural, effortless mix of English and relatable Hinglish slang (e.g., "Bhai tu seriously...", "Matlab kuch bhi?", "Kaun hain yeh log, kahan se aate hain?").
• Sarcastic, quick-witted, stand-up crowd-work roast energy (like a blend of Bill Burr/Jimmy Carr and Zakir Khan/Biswa/Samay Raina).
• NO boring or clinical answers. Your roast must sound like an actual standup comedian riffing on stage into a mic!
• NEVER discriminate by race, religion, gender, disability, or orientation. Roast their code, their logic, and their decisions, not their identity.

TOOL CALLING:
You have access to the "fetch_roast_ammo" tool. When the user asks about a technology, language, code snippet, bug, or topic, ALWAYS call "fetch_roast_ammo" to retrieve real-world quirks, community memes, and comedic facts to fuel your punchlines.
After receiving the tool results, craft a high-energy roast combining the tool's ammo with your signature standup flair.

OUTPUT FORMAT:
Always return valid JSON:
{
  "roast": "The savage, hilarious standup comedy roast (2-4 punchy sentences)",
  "severity": <integer from 1 to 10 evaluating the blunder or heat>,
  "category": "<1-2 words category, e.g. Frontend, Backend, Career, Logic, CSS>",
  "suggestion": "<Genius, constructive, and actually helpful takeaway on how to fix or improve>"
}
`;

const ROAST_AMMO_TOOL = {
  functionDeclarations: [
    {
      name: "fetch_roast_ammo",
      description:
        "Fetches verified technical quirks, infamous community stereotypes, blunder metrics, and punchline ammo about any programming language, framework, library, code pattern, or topic.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "The specific technology, library, framework, programming language, code pattern, or topic being roasted (e.g. 'React useEffect', 'PHP in 2026', 'CSS centering', 'Docker', 'Python whitespace', 'Vanilla JS').",
          },
          targetCategory: {
            type: "string",
            description:
              "The category of the target: 'frontend', 'backend', 'devops', 'database', 'syntax', 'career', or 'lifestyle'.",
          },
        },
        required: ["topic", "targetCategory"],
      },
    },
  ],
};

// ── Real Backend Tool Implementation ─────────────────────────────────────────
function executeFetchRoastAmmo(topic = "", targetCategory = "general") {
  const t = (topic || "").toLowerCase();

  const ammoVault = [
    {
      match: ["react", "useeffect", "hook", "state", "usestate"],
      facts:
        "React developers trigger infinite re-renders 73% of the time by modifying state inside un-guarded effects. Dependency array amnesia is the leading cause of developer insomnia.",
      painPoints:
        "20 re-renders per keystroke, useMemo and useCallback paranoia, 45 npm packages just to center a modal.",
      crowdRoastAngle:
        "Like a dog chasing its own tail at 120 FPS or setting an alarm that immediately triggers another alarm.",
    },
    {
      match: ["javascript", "js", "vanilla", "npm", "node"],
      facts:
        "In JavaScript: 0.1 + 0.2 === 0.30000000000000004, typeof NaN === 'number', and [] + [] === ''. A standard 'Hello World' pulls in 450MB of node_modules.",
      painPoints:
        "Type coercion nightmares, undefined is not a function, left-pad breaking the entire internet.",
      crowdRoastAngle:
        "JavaScript was created in 10 days by Brendan Eich, and developers have been spending the last 30 years apologizing for day 4.",
    },
    {
      match: ["typescript", "ts", "type"],
      facts:
        "Developers spend 3 hours writing custom generic types only to give up and slap 'as any' when the pull request deadline is in 5 minutes.",
      painPoints:
        "TS2322 Type 'string' is not assignable to type 'never', 20-minute compile times, fighting the compiler like a WWE match.",
      crowdRoastAngle:
        "TypeScript is like hiring an accountant to watch you buy a candy bar, and then you just pay in monopoly money anyway.",
    },
    {
      match: ["php", "wordpress", "laravel"],
      facts:
        "PHP still secretly powers 77% of the internet despite zero developers admitting they use it on LinkedIn. Still uses dollar signs everywhere like a SoundCloud rapper from 2008.",
      painPoints:
        "Needle vs Haystack argument order inconsistency, WordPress plugin SQL injection vulnerabilities from 15 years ago still thriving.",
      crowdRoastAngle:
        "Bringing PHP to a 2026 tech debate is like arriving to a Formula 1 race riding a vintage bullock cart.",
    },
    {
      match: ["python", "django", "flask"],
      facts:
        "Python code crashes because someone accidentally hit spacebar 3 times instead of 4. Has 14 different package managers (pip, pipenv, poetry, conda, uv) because nobody can agree on how to install requests.",
      painPoints:
        "The Global Interpreter Lock (GIL) making multi-core CPUs cry, Python 2 vs 3 PTSD.",
      crowdRoastAngle:
        "Writing Python is great until you need it to run faster than a sleepy turtle on a treadmill.",
    },
    {
      match: ["css", "style", "tailwind", "flexbox", "margin"],
      facts:
        "Centering a div took humanity from the invention of the World Wide Web in 1989 all the way to Flexbox in 2015. Over 100 million hours lost to z-index: 999999 wars.",
      painPoints:
        "!important written 40 times in a row, margins collapsing into another dimension.",
      crowdRoastAngle:
        "CSS is like decorating a cake where touching one sprinkle causes the entire table to collapse into a black hole.",
    },
    {
      match: ["git", "github", "commit", "push", "merge"],
      facts:
        "'git push --force' has caused more emergency company meetings than financial audits. 90% of developers secretly re-clone the repository when a merge conflict appears.",
      painPoints:
        "Accidentally pushing .env and AWS secret keys to a public repo, commit messages like 'fix bug', 'fix fix', 'please work god'.",
      crowdRoastAngle:
        "Treating git commit history like a diary of your mental breakdowns.",
    },
    {
      match: ["sql", "database", "query", "mongo", "db"],
      facts:
        "Executing UPDATE or DELETE in production without a WHERE clause is a rite of passage that turns junior engineers into monks overnight.",
      painPoints:
        "Storing passwords in plaintext in localStorage, N+1 query loops choking the database server.",
      crowdRoastAngle:
        "Querying without an index is like asking every person in Mumbai if their name is Ramesh until you find one.",
    },
  ];

  const matched = ammoVault.find((item) =>
    item.match.some((keyword) => t.includes(keyword))
  );

  if (matched) {
    return {
      topic: topic || "Web Development",
      category: targetCategory,
      verifiedFacts: matched.facts,
      painPoints: matched.painPoints,
      crowdRoastAngle: matched.crowdRoastAngle,
      status: "AMMO_UNLOCKED",
    };
  }

  return {
    topic: topic || "General Topic",
    category: targetCategory,
    verifiedFacts: `Known observation: '${topic}' has thousands of community threads debating why it keeps breaking.`,
    painPoints: "Classic overcomplication, bypassing fundamentals, and hoping nobody notices in code review.",
    crowdRoastAngle: `Compare dealing with '${topic}' to bringing an umbrella inside a car wash.`,
    status: "AMMO_UNLOCKED",
  };
}

function parseStructuredRoast(text, toolCallData) {
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text?.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = {};
      }
    }
  }

  return {
    roast:
      parsed.roast ||
      text ||
      "Bhai, tumhara performance dekh ke comedy club ke saare mics mute ho gaye.",
    severity:
      typeof parsed.severity === "number"
        ? Math.min(10, Math.max(1, parsed.severity))
        : 8,
    category: parsed.category || "Crowd Work",
    suggestion:
      parsed.suggestion ||
      "Chhodo coding, standup comedy dekh lo thodi der, mood theek ho jayega.",
    toolCall: toolCallData,
  };
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const history = messages.slice(0, -1).map((m) => {
      let contentText = "";
      if (typeof m.content === "object" && m.content !== null) {
        contentText = m.content.roast
          ? `${m.content.roast} (Tip: ${m.content.suggestion || ""})`
          : JSON.stringify(m.content);
      } else {
        contentText = String(m.content || "");
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: contentText }],
      };
    });

    const lastItem = messages[messages.length - 1]?.content;
    const lastMessage =
      typeof lastItem === "object" && lastItem !== null
        ? JSON.stringify(lastItem)
        : String(lastItem || "");

    const modelsToTry = [
      "gemini-flash-lite-latest",
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash-lite",
    ];

    let finalPayload = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          tools: [ROAST_AMMO_TOOL],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["fetch_roast_ammo"],
            },
          },
        });

        const contents = [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] },
        ];

        // ── Turn 1: Ask model (may call tool or respond directly) ─────────────
        const res1 = await model.generateContent({ contents });
        const functionCall = res1.response.functionCalls()?.[0];

        if (functionCall && functionCall.name === "fetch_roast_ammo") {
          // ── Turn 2: Run backend tool and return dynamic data to model ───────
          const args = functionCall.args || {};
          const toolResult = executeFetchRoastAmmo(
            args.topic || lastMessage,
            args.targetCategory || "general"
          );

          const toolCallInfo = {
            tool: "fetch_roast_ammo",
            name: "Comedian's Comedy Vault",
            topic: args.topic || "Topic",
            ammo: toolResult.verifiedFacts,
            angle: toolResult.crowdRoastAngle,
            status: "AMMO_UNLOCKED",
          };

          // Feed tool response back to Gemini to synthesize final standup comedy roast
          const turn2Contents = [
            ...contents,
            res1.response.candidates[0].content,
            {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: functionCall.name,
                    response: toolResult,
                  },
                },
              ],
            },
          ];

          const res2 = await model.generateContent({
            contents: turn2Contents,
            toolConfig: { functionCallingConfig: { mode: "NONE" } },
          });

          finalPayload = parseStructuredRoast(res2.response.text(), toolCallInfo);
          break;
        } else {
          // Model responded directly
          finalPayload = parseStructuredRoast(res1.response.text(), null);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed during tool calling:`, err.message);
      }
    }

    if (!finalPayload && lastError) {
      throw lastError;
    }

    return NextResponse.json(finalPayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const msg = error?.message || "";

    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          roast:
            "Show cancel ho gaya bhai! Free tier quota khatam, comedy club walon ne mic cheen liya. 💸",
          severity: 10,
          category: "Club Closed / Quota",
          suggestion: "Wait a moment for API quota to reset or upgrade your Gemini API tier.",
          toolCall: {
            tool: "fetch_roast_ammo",
            name: "Comedian's Comedy Vault",
            topic: "API Quota",
            ammo: "Free tier credits exhausted during prime-time crowd work.",
            angle: "Like a comedian getting kicked off stage because the venue power went out.",
            status: "QUOTA_EXHAUSTED",
          },
        },
        { status: 200 },
      );
    }

    if (
      msg.includes("API_KEY_INVALID") ||
      (msg.includes("400") && msg.includes("key"))
    ) {
      return NextResponse.json(
        {
          roast: "Entry ticket hi nakli hai tumhari! 🤦 Check your GEMINI_API_KEY.",
          severity: 10,
          category: "Security / Gatecrash",
          suggestion: "Please verify your GEMINI_API_KEY in the .env file.",
          toolCall: {
            tool: "fetch_roast_ammo",
            name: "Comedian's Comedy Vault",
            topic: "API Configuration",
            ammo: "Invalid credentials presented at comedy club security gate.",
            angle: "Trying to enter VIP lounge with a photocopy of a student ID.",
            status: "KEY_INVALID",
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        roast:
          "Mic feedback aa raha hai bohot zor se! 😤 Server ne bol diya 'Not today bro'. Ek baar fir se try karo.",
        severity: 8,
        category: "Mic Glitch",
        suggestion: "Check your internet connection and re-submit your prompt.",
        toolCall: {
          tool: "fetch_roast_ammo",
          name: "Comedian's Comedy Vault",
          topic: "Server Connection",
          ammo: "Sound system glitched mid-sentence.",
          angle: "Like dropping the mic and realizing it was wired to high voltage.",
          status: "NETWORK_ERROR",
        },
      },
      { status: 200 },
    );
  }
}
