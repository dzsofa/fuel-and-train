import Anthropic from '@anthropic-ai/sdk';

export async function helloStream() {
  const client = new Anthropic();

  const messageStream = client.messages.stream({
    max_tokens: 1024,
    model: 'claude-haiku-4-5-20251001',
    messages: [
      {
        role: 'user',
        content: 'give me a one-sentence tip for a plantar excercise'
      }
    ]
  });

  for await (const event of messageStream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      process.stdout.write(event.delta.text);
    }
  }
  console.log();

  const response = await messageStream.finalMessage();
  console.log(`Usage: `, response.usage);

  if (response.stop_reason === 'max_tokens') {
    console.warn(response.stop_reason);
  } else {
    console.log(response.stop_reason);
  }
}

const isMain = process.argv[1]?.endsWith('hello-stream.ts');
if (isMain) helloStream();
