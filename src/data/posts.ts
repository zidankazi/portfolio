export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    readTime: string;
    category: string;
    content: string;
    excerpt: string;
}

export const posts: BlogPost[] = [
    {
        slug: 'ai-isnt-writing',
        title: 'Your AI Isn’t “Writing.” It’s Picking Tokens One Tiny Gamble at a Time.',
        date: '2026-01-21',
        readTime: '7 min read',
        category: 'AI Engineering',
        excerpt: 'Most people talk about large language models like they’re typing. Like there’s a little author inside the machine, thinking in sentences, choosing words, and “writing” an answer. That’s not what’s happening.',
        content: `
Most people talk about [large language models](https://en.wikipedia.org/wiki/Large_language_model) like they’re typing. Like there’s a little author inside the machine, thinking in sentences, choosing words, and “writing” an answer.

That’s not what’s happening.

When an LLM responds to you, it isn’t generating text the way you imagine. It’s generating tokens, small pieces of text from a fixed vocabulary, and it does it in a loop: pick one token, append it, pick the next, repeat.

That detail sounds nerdy. It’s actually the difference between “why did the model do that?” and “oh, I see how to control this.”

Let’s break down what’s really going on under the hood, starting with **tokenization**, then the practical knobs you can turn to influence output quality and consistency.

## What Tokenization Actually Is

Tokenization is the step where your text gets converted into a sequence of units the model can process.

You type:

> “once upon a time there was a…”

The system converts it into something like:

> [token_451, token_9832, token_220, token_778, …]

The model never “sees” your original sentence. It sees those token IDs. Each token ID corresponds to a chunk of text that exists in the model’s vocabulary.

So what is a token?

A token is not always a word. It can be:

*   a whole word ("apple")
*   part of a word ("ing", "tion")
*   a space plus a word (" apple")
*   punctuation (".", ",")
*   emojis and symbols ("🔥", "→")
*   numbers (sometimes "10" is a single token, sometimes it becomes "1" + "0")

Tokens cover a lot of ground because the model has to support messy, real-world language. That includes different alphabets, accents, punctuation habits, code, and everything else people type.

## Why not just use words?

Because words are not clean or universal.

“Unbelievable” might be one word, but “un-believ-able” also contains meaningful pieces. Languages differ wildly. New words appear constantly. Names are infinite. If vocabularies were “one token per word,” most words would be unknown.

So most modern tokenizers aim for a middle ground: common words become single tokens, rarer words get broken into reusable pieces. That’s the trick that lets models handle both everyday language and weird new terms without needing an infinite vocabulary.

## How Tokenization Works (In Plain English)

Most LLM tokenizers are variants of subword tokenization methods such as [Byte Pair Encoding (BPE)](https://huggingface.co/docs/transformers/tokenizer_summary). You don’t need the math to understand the intuition.

Here’s the basic idea:

1.  **Start small.** The tokenizer can represent text using very small units (often bytes or characters).
2.  **Learn merges from data.** During tokenizer training, it looks at massive text corpora and repeatedly merges common pairs into bigger chunks.
3.  **Build a vocabulary of chunks.** Over time, frequent patterns become their own tokens. Rare patterns remain split.

So a common word like “computer” may become one token, while something rarer like “electroencephalography” gets split into multiple subword pieces.

**What decides how your word gets split?**

Frequency and efficiency.

If a chunk appears often enough in training data, it is “worth it” to allocate a token for it. If it’s rare, it’s cheaper to represent it as multiple smaller chunks.

This is why niche jargon, names, and slang can behave inconsistently across models. If a term was common in the training data, it may be a single token. If not, it may be chopped up in a way that looks random to humans.

## Why Spaces, Capitalization, and Punctuation Matter

Tokenizers usually treat spaces as meaningful. Often the [token for "apple"](https://platform.openai.com/tokenizer) is different from " apple".

That sounds annoying. It’s intentional.

Spaces carry information. They mark word boundaries. They are frequent. They help the tokenizer represent common patterns more efficiently.

Capitalization can also be distinct:

*   "Red" may tokenize differently than "red"
*   "HTTP" may tokenize differently than "http"

Same with punctuation:

*   "word." might tokenize differently than "word" + "."
*   Some tokens bundle punctuation with spaces or with prior text, because that pattern is common in training data

This is one reason tiny formatting changes can create surprisingly different outputs, especially when the model is near a decision boundary.

And it also explains why trailing spaces can cause weirdness. That last space can change the final token. Then the model is effectively continuing from a different internal representation than you intended.

## Why Tokenization Explains “Dumb” Failures

People get confused when an LLM can explain quantum mechanics but fails at “count the number of letters in this sentence.”

Tokenization is a big part of the answer.

A model is not operating on characters. It’s operating on token IDs. If your sentence splits into tokens in a way that doesn’t align with individual letters or words, then “counting” becomes a fuzzy inference task instead of a direct computation.

Humans are good at exact counting because we can directly inspect characters. The model can’t. It only sees the tokenized form and tries to predict what a “correct-looking” answer should be based on patterns in training data.

Sometimes it matches. Sometimes it doesn’t.

## Special Tokens: The Hidden Markers That Shape Chat Behavior

Not all tokens represent normal text. Some are special tokens used by the system to structure conversations.

A few examples:

*   **End-of-sequence / stop token:** tells the model “this is the end”
*   **Role separators:** indicate “user said this” vs “assistant said this”
*   **System prompt boundaries:** mark instructions as higher priority than user content

These tokens matter because they teach the model how to behave in chat format. They provide structure, boundaries, and hierarchy.

That is why the same model can act differently when you use it via a chat interface (like [Sage](/projects)) versus raw completion mode. The hidden scaffolding changes what the model sees.

## The Second Illusion: The Model Isn’t Choosing Words, It’s Sampling Tokens

Once your prompt is tokenized, generation works like this:

1.  The model reads the tokens.
2.  It computes a probability distribution over the next token.
3.  A sampling strategy selects one token.
4.  That token gets appended.
5.  Repeat until stopping.

Almost all the computation is deterministic. The uncertainty enters at the sampling step.

That’s where your control knobs live.

## Temperature: The Randomness Dial People Misuse the Most

Temperature changes how peaked or flat the probability distribution becomes before sampling.

*   **Temperature = 0:** pick the most likely token every time. Same prompt gives the same output.
*   **Temperature around 1:** sample from the model’s natural distribution.
*   **Temperature > 1:** flatten the probabilities so less likely tokens show up more.

Temperature is not a smooth “creativity slider.” Small changes in certain ranges can have big effects.

**When to go low**

Use low temperature when you need:

*   reproducible results (tests, evals)
*   strict formatting (JSON, schemas, code)
*   consistent classification labels

**When to go higher**

Use higher temperature for:

*   brainstorming
*   storytelling
*   generating multiple angles
*   breaking out of repetitive phrasing

## Top-P: Variety With Guardrails

Top-p (nucleus sampling) limits the model to only the smallest set of tokens whose probabilities add up to p.

*   **top-p = 1.0:** consider everything
*   **top-p = 0.2:** consider only the most likely cluster
*   **top-p = 0.1:** very tight guardrails

A common tactic is to use a slightly higher temperature but reduce top-p. You get variety, but only among plausible options.

## The Practical Takeaway: Tokenization Is Part of Prompting

Prompting is not just what you say. It’s also how your text gets segmented internally.

That’s why:

*   formatting can change quality
*   one extra space can derail output
*   strict outputs require stricter sampling settings

If you’re building anything serious with LLMs, tokenization is not trivia. It’s part of the **control surface**.

Once you see that, the model feels less like magic and more like an instrument you can steer.
`
    }
];
