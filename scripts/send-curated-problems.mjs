import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

const ROOT = process.cwd();
const PROGRESS_PATH = path.join(ROOT, "data", "progress.json");

await loadLocalEnv();

const LEVEL_CONFIG = {
  Beginner: { sessionsPerWeek: 2, count: 3 },
  Intermediate: { sessionsPerWeek: 3, count: 3 },
  Advanced: { sessionsPerWeek: 4, count: 2 },
};

const ROADMAP = [
  {
    topic: "Arrays & Hashing",
    level: "Beginner",
    problems: [
      p(217, "Contains Duplicate", "Easy", "contains-duplicate"),
      p(242, "Valid Anagram", "Easy", "valid-anagram"),
      p(1, "Two Sum", "Easy", "two-sum"),
      p(49, "Group Anagrams", "Medium", "group-anagrams"),
      p(347, "Top K Frequent Elements", "Medium", "top-k-frequent-elements"),
    ],
  },
  {
    topic: "Two Pointers",
    level: "Beginner",
    problems: [
      p(125, "Valid Palindrome", "Easy", "valid-palindrome"),
      p(167, "Two Sum II - Input Array Is Sorted", "Medium", "two-sum-ii-input-array-is-sorted"),
      p(15, "3Sum", "Medium", "3sum"),
      p(11, "Container With Most Water", "Medium", "container-with-most-water"),
    ],
  },
  {
    topic: "Sliding Window",
    level: "Beginner",
    problems: [
      p(121, "Best Time to Buy and Sell Stock", "Easy", "best-time-to-buy-and-sell-stock"),
      p(3, "Longest Substring Without Repeating Characters", "Medium", "longest-substring-without-repeating-characters"),
      p(424, "Longest Repeating Character Replacement", "Medium", "longest-repeating-character-replacement"),
      p(567, "Permutation in String", "Medium", "permutation-in-string"),
    ],
  },
  {
    topic: "Stack",
    level: "Beginner",
    problems: [
      p(20, "Valid Parentheses", "Easy", "valid-parentheses"),
      p(155, "Min Stack", "Medium", "min-stack"),
      p(150, "Evaluate Reverse Polish Notation", "Medium", "evaluate-reverse-polish-notation"),
      p(739, "Daily Temperatures", "Medium", "daily-temperatures"),
    ],
  },
  {
    topic: "Binary Search",
    level: "Intermediate",
    problems: [
      p(704, "Binary Search", "Easy", "binary-search"),
      p(74, "Search a 2D Matrix", "Medium", "search-a-2d-matrix"),
      p(875, "Koko Eating Bananas", "Medium", "koko-eating-bananas"),
      p(153, "Find Minimum in Rotated Sorted Array", "Medium", "find-minimum-in-rotated-sorted-array"),
      p(33, "Search in Rotated Sorted Array", "Medium", "search-in-rotated-sorted-array"),
    ],
  },
  {
    topic: "Linked List",
    level: "Intermediate",
    problems: [
      p(206, "Reverse Linked List", "Easy", "reverse-linked-list"),
      p(21, "Merge Two Sorted Lists", "Easy", "merge-two-sorted-lists"),
      p(141, "Linked List Cycle", "Easy", "linked-list-cycle"),
      p(143, "Reorder List", "Medium", "reorder-list"),
      p(19, "Remove Nth Node From End of List", "Medium", "remove-nth-node-from-end-of-list"),
    ],
  },
  {
    topic: "Trees",
    level: "Intermediate",
    problems: [
      p(226, "Invert Binary Tree", "Easy", "invert-binary-tree"),
      p(104, "Maximum Depth of Binary Tree", "Easy", "maximum-depth-of-binary-tree"),
      p(543, "Diameter of Binary Tree", "Easy", "diameter-of-binary-tree"),
      p(102, "Binary Tree Level Order Traversal", "Medium", "binary-tree-level-order-traversal"),
      p(98, "Validate Binary Search Tree", "Medium", "validate-binary-search-tree"),
    ],
  },
  {
    topic: "Heap / Priority Queue",
    level: "Intermediate",
    problems: [
      p(703, "Kth Largest Element in a Stream", "Easy", "kth-largest-element-in-a-stream"),
      p(1046, "Last Stone Weight", "Easy", "last-stone-weight"),
      p(215, "Kth Largest Element in an Array", "Medium", "kth-largest-element-in-an-array"),
      p(973, "K Closest Points to Origin", "Medium", "k-closest-points-to-origin"),
      p(621, "Task Scheduler", "Medium", "task-scheduler"),
    ],
  },
  {
    topic: "Graphs",
    level: "Advanced",
    problems: [
      p(200, "Number of Islands", "Medium", "number-of-islands"),
      p(133, "Clone Graph", "Medium", "clone-graph"),
      p(695, "Max Area of Island", "Medium", "max-area-of-island"),
      p(417, "Pacific Atlantic Water Flow", "Medium", "pacific-atlantic-water-flow"),
      p(127, "Word Ladder", "Hard", "word-ladder"),
    ],
  },
  {
    topic: "Dynamic Programming",
    level: "Advanced",
    problems: [
      p(70, "Climbing Stairs", "Easy", "climbing-stairs"),
      p(198, "House Robber", "Medium", "house-robber"),
      p(322, "Coin Change", "Medium", "coin-change"),
      p(300, "Longest Increasing Subsequence", "Medium", "longest-increasing-subsequence"),
      p(72, "Edit Distance", "Medium", "edit-distance"),
    ],
  },
  {
    topic: "Backtracking",
    level: "Advanced",
    problems: [
      p(78, "Subsets", "Medium", "subsets"),
      p(39, "Combination Sum", "Medium", "combination-sum"),
      p(46, "Permutations", "Medium", "permutations"),
      p(79, "Word Search", "Medium", "word-search"),
      p(51, "N-Queens", "Hard", "n-queens"),
    ],
  },
];

function p(number, title, difficulty, slug) {
  return {
    number,
    title,
    difficulty,
    slug,
    url: `https://leetcode.com/problems/${slug}/`,
  };
}

async function main() {
  const progress = await readProgress();
  const selectedTopic = pickTopic(progress);
  const selectedProblems = await pickProblems(selectedTopic, progress);

  if (selectedProblems.length === 0) {
    throw new Error("No unsent problems remain. Add more problems or clear data/progress.json.");
  }

  await sendEmail({
    topic: selectedTopic.topic,
    level: selectedTopic.level,
    problems: selectedProblems,
  });

  const now = new Date().toISOString();
  progress.sentProblemSlugs = unique([
    ...progress.sentProblemSlugs,
    ...selectedProblems.map((problem) => problem.slug),
  ]);
  progress.history.push({
    sentAt: now,
    topic: selectedTopic.topic,
    level: selectedTopic.level,
    problems: selectedProblems.map(({ number, title, difficulty, slug, url }) => ({
      number,
      title,
      difficulty,
      slug,
      url,
    })),
  });

  await fs.mkdir(path.dirname(PROGRESS_PATH), { recursive: true });
  await fs.writeFile(PROGRESS_PATH, `${JSON.stringify(progress, null, 2)}\n`);
  console.log(`Sent ${selectedProblems.length} ${selectedTopic.level} problem(s): ${selectedTopic.topic}`);
}

async function readProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_PATH, "utf8"));
  } catch {
    return { sentProblemSlugs: [], history: [] };
  }
}

function pickTopic(progress) {
  const sent = new Set(progress.sentProblemSlugs || []);
  const candidates = ROADMAP.filter((topic) => topic.problems.some((problem) => !sent.has(problem.slug)));
  if (candidates.length === 0) return ROADMAP[0];

  const historyLength = progress.history?.length || 0;
  const weekSlots = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Intermediate",
    "Beginner",
    "Advanced",
    "Advanced",
  ];
  const preferredLevel = weekSlots[historyLength % weekSlots.length];
  return candidates.find((topic) => topic.level === preferredLevel) || candidates[0];
}

async function pickProblems(topic, progress) {
  const sent = new Set(progress.sentProblemSlugs || []);
  const unsent = topic.problems.filter((problem) => !sent.has(problem.slug));
  const count = LEVEL_CONFIG[topic.level].count;
  const deterministicPick = unsent.slice(0, count).map(addTeachingNotes(topic));

  if (!process.env.OPENAI_API_KEY) return deterministicPick;

  try {
    return await pickWithOpenAI(topic, deterministicPick, count);
  } catch (error) {
    console.warn(`AI selection failed, using deterministic list: ${error.message}`);
    return deterministicPick;
  }
}

function addTeachingNotes(topic) {
  return (problem, index) => ({
    ...problem,
    learningOrder: index + 1,
    why: `Builds core ${topic.topic} pattern recognition at a ${topic.level.toLowerCase()} pace.`,
    hint: "Write the brute force idea first, then identify the repeated work you can remove.",
  });
}

async function pickWithOpenAI(topic, candidates, count) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a LeetCode study curator. Select only from the provided JSON. Do not invent problem titles, numbers, slugs, or URLs.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Choose ${count} problems for the next email, ordered beginner to advanced within the topic.`,
            topic: topic.topic,
            level: topic.level,
            candidates,
            output:
              "Return JSON only: [{ number, title, difficulty, slug, url, why, hint }]. Keep why and hint short.",
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "[]";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  const bySlug = new Map(candidates.map((problem) => [problem.slug, problem]));

  return parsed
    .filter((problem) => bySlug.has(problem.slug))
    .slice(0, count)
    .map((problem, index) => ({
      ...bySlug.get(problem.slug),
      learningOrder: index + 1,
      why: problem.why || bySlug.get(problem.slug).why,
      hint: problem.hint || bySlug.get(problem.slug).hint,
    }));
}

async function sendEmail({ topic, level, problems }) {
  const required = ["RECIPIENT_EMAIL", "SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"LeetCode Curator" <${process.env.SMTP_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `LeetCode Curator: ${topic} (${level})`,
    text: buildTextEmail({ topic, level, problems }),
    html: buildHtmlEmail({ topic, level, problems }),
  });
}

function buildTextEmail({ topic, level, problems }) {
  return [
    `Your LeetCode set: ${topic} (${level})`,
    "",
    ...problems.map(
      (problem) =>
        `${problem.learningOrder}. [${problem.difficulty}] #${problem.number} ${problem.title}\n${problem.url}\nWhy: ${problem.why}\nHint: ${problem.hint}`
    ),
    "",
    "Mark them solved in data/progress.json or let this automation keep moving through the roadmap after each sent email.",
  ].join("\n\n");
}

function buildHtmlEmail({ topic, level, problems }) {
  const cards = problems
    .map(
      (problem) => `
        <li style="margin:0 0 18px 0;padding:16px;border:1px solid #e5e7eb;border-radius:8px;list-style:none">
          <div style="font-size:13px;color:#6b7280">#${problem.number} · ${problem.difficulty}</div>
          <h2 style="margin:4px 0 8px 0;font-size:18px">${escapeHtml(problem.title)}</h2>
          <p style="margin:0 0 8px 0">${escapeHtml(problem.why)}</p>
          <p style="margin:0 0 12px 0;color:#4b5563"><strong>Hint:</strong> ${escapeHtml(problem.hint)}</p>
          <a href="${problem.url}" style="color:#f59e0b;font-weight:700">Open on LeetCode</a>
        </li>`
    )
    .join("");

  return `
    <main style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h1 style="font-size:22px;margin-bottom:4px">Your LeetCode set</h1>
      <p style="margin-top:0;color:#6b7280">${escapeHtml(topic)} · ${escapeHtml(level)}</p>
      <ol style="padding:0;margin:20px 0">${cards}</ol>
      <p style="color:#6b7280;font-size:13px">Consistency beats intensity. Solve clean, then review the pattern.</p>
    </main>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set(values)];
}

async function loadLocalEnv() {
  for (const filename of [".env", ".env.local"]) {
    try {
      const content = await fs.readFile(path.join(ROOT, filename), "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        if (!key || process.env[key] !== undefined) continue;

        process.env[key] = rawValue.replace(/^["']|["']$/g, "");
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
