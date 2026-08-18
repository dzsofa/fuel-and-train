import { config } from '@/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock
} from '@anthropic-ai/sdk/resources';

export async function runToolLoop(
  client: Anthropic,
  messages: MessageParam[],
  tools: Tool[],
  dispatch: (toolName: string, input: unknown) => unknown,
  systemPrompt?: string
): Promise<string> {
  let lastResponse = await client.messages.create({
    max_tokens: config.maxOutputTokens,
    model: config.anthropicModel,
    ...(systemPrompt && { system: systemPrompt }),
    messages,
    tools
  });

  messages.push({ role: 'assistant', content: lastResponse.content });

  while (lastResponse.stop_reason !== 'end_turn') {
    const toolUses = lastResponse.content.filter(
      (toolUseBlock): toolUseBlock is ToolUseBlock =>
        toolUseBlock.type === 'tool_use'
    );

    const toolResults: ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      try {
        const output = dispatch(use.name, use.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: use.id,
          content: JSON.stringify(output)
        });
      } catch (error) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: use.id,
          is_error: true,
          content: error instanceof Error ? error.message : String(error)
        });
      }
    }

    messages.push({ role: 'user', content: toolResults });

    lastResponse = await client.messages.create({
      max_tokens: config.maxOutputTokens,
      model: config.anthropicModel,
      ...(systemPrompt && { system: systemPrompt }),
      messages,
      tools
    });

    messages.push({ role: 'assistant', content: lastResponse.content });
  }

  const textBlock = lastResponse.content.find((block) => block.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}
