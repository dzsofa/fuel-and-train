import Anthropic from '@anthropic-ai/sdk';
import {
  MessageParam,
  TextBlock,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock
} from '@anthropic-ai/sdk/resources';
import type { RouteConfig } from '@/model/router';
import { costLogger } from '@/cost/logger';

export async function runToolLoop(
  client: Anthropic,
  messages: MessageParam[],
  tools: Tool[],
  dispatch: (toolName: string, input: unknown) => unknown,
  systemPrompt: string,
  routeConfig: RouteConfig
): Promise<string> {
  const system = routeConfig.enableCaching
    ? [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const }
        }
      ]
    : systemPrompt;

  let lastResponse = await client.messages.create({
    model: routeConfig.modelId,
    max_tokens: routeConfig.maxTokens,
    system,
    messages,
    tools
  });

  console.log(
    `Usage cost: $${costLogger(routeConfig.modelId, lastResponse.usage)?.toFixed(6)}`
  );
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

    // Guard: if stop_reason is not 'end_turn' but no tool_use blocks were found,
    // the model returned a text-only response mid-loop (e.g. 'max_tokens' or
    // unexpected stop). Break rather than send an empty user message.
    if (toolResults.length === 0) break;

    messages.push({ role: 'user', content: toolResults });

    lastResponse = await client.messages.create({
      model: routeConfig.modelId,
      max_tokens: routeConfig.maxTokens,
      system,
      messages,
      tools
    });

    console.log(
      `Usage cost: $${costLogger(routeConfig.modelId, lastResponse.usage)?.toFixed(6)}`
    );
    messages.push({ role: 'assistant', content: lastResponse.content });
  }

  // Concatenate all text blocks (model may split output across multiple)
  const text = lastResponse.content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (!text) {
    // Debug: log content types so caller can diagnose empty responses
    const types = lastResponse.content.map((b) => b.type).join(', ');
    console.warn(
      `[loop] Warning: no text block in final response. stop_reason=${lastResponse.stop_reason}, content blocks: [${types}]`
    );
  }

  return text;
}
