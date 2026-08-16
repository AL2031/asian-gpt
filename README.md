# AsianGPT

A ChatGPT-style web app built with Next.js. Chat is powered by **Groq** (fast Llama
inference); image generation and image editing are powered by **Hugging Face**
Inference API models. Both providers support multiple rotating API keys with
automatic failover.

## Features

- **Chat** - streamed responses from a Groq-hosted model (default `llama-3.3-70b-versatile`).
- **Generate images** - toggle "Generate" and describe an image (default model
  `black-forest-labs/FLUX.1-schnell`).
- **Edit images** - attach a photo (paperclip icon) and describe the edit; it's sent
  to an instruction-based image editing model (default `timbrooks/instruct-pix2pix`).
- **Multi-key rotation + failover** - configure several Groq and/or Hugging Face
  keys; every request round-robins across them and automatically retries on a
  different key if one is rate-limited (429) or errors.

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
HF_API_KEY_1=hf_...
HF_API_KEY_2=hf_...
HF_API_KEY_3=hf_...
```

You don't need exactly 3 keys or a 1:1 split between providers - add however
many `GROQ_API_KEY_N` / `HF_API_KEY_N` variables you have (numbered `_1` through
`_10`, or a single unsuffixed `GROQ_API_KEY` / `HF_API_KEY` if you only have one
per provider). The app pools and rotates across whatever it finds.

- Get a Groq key at https://console.groq.com
- Get a Hugging Face access token (with **Inference API** permission) at
  https://huggingface.co/settings/tokens

## 3. Run locally

```bash
npm run dev
```

Visit http://localhost:3000.

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then add the same environment variables from `.env.local` in your Vercel
project: **Project Settings → Environment Variables**. Redeploy after adding
them (`vercel --prod`).

## Notes & things to verify before relying on this in production

- **Hugging Face payload format**: this app calls the HF Inference API with a
  JSON body (`{ inputs, parameters }`). That's the standard shape for
  `text-to-image` and most `image-to-image` pipelines, but Hugging Face
  occasionally changes serverless Inference API conventions and not every
  model on the Hub follows the same contract. If `generate-image` or
  `edit-image` errors out, check the `detail` field returned in the response
  against that model's current API docs on its Hugging Face model page.
- **Model cold starts**: the first request to a Hugging Face model after it's
  been idle can take 10-30+ seconds while it loads onto a worker
  (`lib/hf.ts` already retries once automatically on that "warming up"
  response).
- **Serverless key rotation**: the round-robin counter lives in memory, so on
  Vercel it resets on cold starts. Rotation still spreads load across warm
  invocations, and the automatic failover-on-error behavior applies to every
  single request regardless.
- Swap `HF_IMAGE_MODEL` / `HF_EDIT_MODEL` / `GROQ_MODEL` env vars any time you
  want to point at a different model - no code changes needed.

## Project structure

```
app/
  page.tsx                    Main chat UI
  api/chat/route.ts           Streams Groq chat completions
  api/generate-image/route.ts Text-to-image via Hugging Face
  api/edit-image/route.ts     Instruction-based image editing via Hugging Face
components/                   UI components
lib/keys.ts                   Multi-key rotation + failover
lib/hf.ts                     Hugging Face call helper (handles cold starts)
```
