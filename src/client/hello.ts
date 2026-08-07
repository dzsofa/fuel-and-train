import { config } from '@/config';
import Anthropic from '@anthropic-ai/sdk';

export async function hello() {
  const client = new Anthropic();
  const response = await client.messages.create({
    max_tokens: config.maxOutputTokens,
    model: config.anthropicModel,
    messages: [
      {
        role: 'user',
        content: 'give me a one-sentence tip for a mid workday stretch'
      }
    ]
  });

  console.log(
    `Response: ${response.content.find((b) => b.type === 'text')?.text}`
  );
  console.log(`Usage: `, response.usage);

  if (response.stop_reason === 'max_tokens') {
    console.warn(response.stop_reason);
  } else {
    console.log(response.stop_reason);
  }
}

const isMain = process.argv[1]?.endsWith('hello.ts');
if (isMain) hello();
