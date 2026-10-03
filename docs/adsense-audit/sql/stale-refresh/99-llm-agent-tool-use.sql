-- stale-refresh 2026-10-04 post #99 llm-에이전트-툴-사용-완전-정복-function-calling부터-mcp까지
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# LLM 에이전트 툴 사용 완전 정복: Function Calling부터 MCP까지

에이전트를 에이전트답게 만드는 것은 **툴 사용(Tool Use)**입니다. LLM이 단순히 텍스트를 생성하는 것을 넘어, 외부 API를 호출하고, 데이터베이스를 조회하고, 코드를 실행하게 만드는 메커니즘입니다.

## 툴 사용의 동작 원리

LLM은 텍스트만 입력받고 텍스트만 출력합니다. 툴 사용은 이 제약을 아래 흐름으로 우회합니다.

```
1. 사용자 메시지 + 툴 스펙 → LLM
2. LLM → "이 툴을 이 인자로 호출하라" (JSON 형태 출력)
3. 런타임이 실제 함수 실행
4. 실행 결과 → LLM에게 다시 전달
5. LLM → 최종 자연어 답변 생성
```

핵심은 **LLM이 직접 함수를 실행하지 않는다**는 점입니다. 런타임이 실행하고, 결과를 LLM에게 넘겨줍니다.

## OpenAI Function Calling

```python
from openai import OpenAI
import json
import os

client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_price",
            "description": "특정 종목의 현재 주가를 조회합니다",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "주식 티커 (예: AAPL, TSLA)"
                    },
                    "currency": {
                        "type": "string",
                        "enum": ["USD", "KRW"]
                    }
                },
                "required": ["symbol"]
            }
        }
    }
]

def get_stock_price(symbol, currency="USD"):
    return {"symbol": symbol, "price": 192.5, "currency": currency}

def run_agent(user_message):
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.chat.completions.create(
            model=os.environ["OPENAI_MODEL"],  # platform.openai.com/docs/models에서 선택
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        msg = response.choices[0].message
        messages.append(msg)

        if msg.tool_calls is None:
            return msg.content

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = get_stock_price(**args)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result)
            })
```

## Anthropic Tool Use

Claude의 툴 사용은 `tool_use` 콘텐츠 블록으로 호출하고, `tool_result`로 반환합니다.

```python
import anthropic, json

client = anthropic.Anthropic()

tools = [{
    "name": "search_docs",
    "description": "내부 문서 데이터베이스에서 관련 문서를 검색합니다",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "max_results": {"type": "integer", "default": 5}
        },
        "required": ["query"]
    }
}]

def search_docs(query, max_results=5):
    return [{"title": "API 인증 가이드", "content": "Bearer 토큰 방식을 사용합니다..."}]

messages = [{"role": "user", "content": "우리 API 인증 방식이 어떻게 돼?"}]

while True:
    response = client.messages.create(
        model="claude-sonnet-5-5",
        max_tokens=1024,
        tools=tools,
        messages=messages
    )

    if response.stop_reason == "end_turn":
        text_block = next(b for b in response.content if b.type == "text")
        print(text_block.text)
        break

    messages.append({"role": "assistant", "content": response.content})

    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = search_docs(**block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False)
            })
    messages.append({"role": "user", "content": tool_results})
```

## Model Context Protocol (MCP)

MCP는 Anthropic이 제안한 **툴 표준화 프로토콜**입니다. 개별 LLM SDK에 종속되지 않고, 서버-클라이언트 구조로 툴을 독립적으로 제공합니다.

```python
# MCP 서버 구현
from mcp.server import Server
import mcp.types as types

server = Server("my-tools-server")

@server.list_tools()
async def handle_list_tools():
    return [
        types.Tool(
            name="query_database",
            description="SQL 쿼리를 실행하고 결과를 반환합니다",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "실행할 SELECT 쿼리"}
                },
                "required": ["sql"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name, arguments):
    if name == "query_database":
        results = execute_query(arguments["sql"])
        return [types.TextContent(type="text", text=str(results))]
```

MCP의 장점은 **재사용성**입니다. 한 번 만든 MCP 서버는 Claude Desktop, Claude Code, 자체 에이전트 등 어디서든 연결해 쓸 수 있습니다.

## 툴 설계 원칙

좋은 툴과 나쁜 툴의 차이는 **description**에 있습니다.

| 나쁜 예 | 좋은 예 |
|--------|--------|
| "데이터를 가져온다" | "주문 ID로 특정 주문의 상태, 금액, 배송 정보를 조회한다. 취소된 주문도 조회 가능하다." |
| 매개변수 설명 없음 | 각 매개변수의 타입, 허용 값, 기본값 명시 |

LLM은 description을 읽고 툴을 선택합니다. 설명이 부정확하면 잘못된 툴을 호출하거나 잘못된 인자를 넣습니다.

## 병렬 툴 호출

여러 툴을 순차 실행하면 느립니다. OpenAI와 Anthropic API 모두 한 턴에 여러 툴을 호출하는 **병렬 툴 호출**을 지원합니다. OpenAI는 `parallel_tool_calls`를 `false`로 두면 한 번에 하나 이하로 제한할 수 있습니다([OpenAI](https://developers.openai.com/api/docs/guides/function-calling), [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)).

```python
import asyncio

async def execute_tools_parallel(tool_calls):
    tasks = [dispatch_tool(tc.function.name, json.loads(tc.function.arguments))
             for tc in tool_calls]
    return await asyncio.gather(*tasks)
```

다음 편에서는 에이전트가 대화 맥락을 유지하고 장기 작업을 수행할 수 있게 하는 **메모리 시스템 설계**를 다룹니다.


## 에디터 노트 — 현장에서는

에이전트에 도구를 많이 붙일수록 똑똑해질 것 같지만, 실제로는 도구가 5~6개를 넘으면 LLM이 '어떤 도구를 언제 쓸지' 판단을 자주 틀립니다. 가장 효과가 컸던 건 도구 개수를 줄이고, 각 도구 설명(description)을 사람이 읽어도 안 헷갈릴 만큼 구체적으로 쓰는 것이었습니다 — `search`보다 `search_internal_docs(사내 위키에서 검색)`처럼요. 도구 설계는 프롬프트 엔지니어링의 연장입니다.

## 출처 · 확인일 2026-10-04
- [OpenAI — Function calling 가이드](https://developers.openai.com/api/docs/guides/function-calling) — `parallel_tool_calls`
- [Anthropic — Tool use 공식 문서](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — 병렬 툴 사용
- [Anthropic — 모델 개요](https://docs.anthropic.com/en/docs/about-claude/models/overview) — 현재 모델 ID `claude-sonnet-5-5`
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

모델 ID는 바뀌므로 실행 전에 각 공급사 모델 페이지에서 현재 ID를 확인하세요.$sr$, content_evidence=jsonb_set($j${"en": {"title": "LLM Agent Tool Use: From Function Calling to MCP", "content": "# Mastering LLM Agent Tool Use: From Function Calling to MCP\n\nWhat makes an agent an agent is **tool use**. It is the mechanism that takes LLMs beyond mere text generation and lets them call external APIs, query databases, and execute code.\n\n## How Tool Use Works\n\nLLMs only accept text as input and only produce text as output. Tool use bypasses that constraint with the following flow.\n\n```\n1. User message + tool spec → LLM\n2. LLM → \"Call this tool with these arguments\" (JSON output)\n3. Runtime executes the actual function\n4. Execution result → passed back to the LLM\n5. LLM → generates the final natural-language answer\n```\n\nThe key point is that **the LLM does not execute functions itself**. The runtime does, then hands the results back to the LLM.\n\n## OpenAI Function Calling\n\n```python\nfrom openai import OpenAI\nimport json\nimport os\n\nclient = OpenAI()\n\ntools = [\n    {\n        \"type\": \"function\",\n        \"function\": {\n            \"name\": \"get_stock_price\",\n            \"description\": \"특정 종목의 현재 주가를 조회합니다\",\n            \"parameters\": {\n                \"type\": \"object\",\n                \"properties\": {\n                    \"symbol\": {\n                        \"type\": \"string\",\n                        \"description\": \"주식 티커 (예: AAPL, TSLA)\"\n                    },\n                    \"currency\": {\n                        \"type\": \"string\",\n                        \"enum\": [\"USD\", \"KRW\"]\n                    }\n                },\n                \"required\": [\"symbol\"]\n            }\n        }\n    }\n]\n\ndef get_stock_price(symbol, currency=\"USD\"):\n    return {\"symbol\": symbol, \"price\": 192.5, \"currency\": currency}\n\ndef run_agent(user_message):\n    messages = [{\"role\": \"user\", \"content\": user_message}]\n\n    while True:\n        response = client.chat.completions.create(\n            model=os.environ[\"OPENAI_MODEL\"],  # pick one from platform.openai.com/docs/models\n            messages=messages,\n            tools=tools,\n            tool_choice=\"auto\"\n        )\n        msg = response.choices[0].message\n        messages.append(msg)\n\n        if msg.tool_calls is None:\n            return msg.content\n\n        for tc in msg.tool_calls:\n            args = json.loads(tc.function.arguments)\n            result = get_stock_price(**args)\n            messages.append({\n                \"role\": \"tool\",\n                \"tool_call_id\": tc.id,\n                \"content\": json.dumps(result)\n            })\n```\n\n## Anthropic Tool Use\n\nClaude's tool use issues calls as `tool_use` content blocks and returns results as `tool_result`.\n\n```python\nimport anthropic, json\n\nclient = anthropic.Anthropic()\n\ntools = [{\n    \"name\": \"search_docs\",\n    \"description\": \"내부 문서 데이터베이스에서 관련 문서를 검색합니다\",\n    \"input_schema\": {\n        \"type\": \"object\",\n        \"properties\": {\n            \"query\": {\"type\": \"string\"},\n            \"max_results\": {\"type\": \"integer\", \"default\": 5}\n        },\n        \"required\": [\"query\"]\n    }\n}]\n\ndef search_docs(query, max_results=5):\n    return [{\"title\": \"API 인증 가이드\", \"content\": \"Bearer 토큰 방식을 사용합니다...\"}]\n\nmessages = [{\"role\": \"user\", \"content\": \"우리 API 인증 방식이 어떻게 돼?\"}]\n\nwhile True:\n    response = client.messages.create(\n        model=\"claude-sonnet-5-5\",\n        max_tokens=1024,\n        tools=tools,\n        messages=messages\n    )\n\n    if response.stop_reason == \"end_turn\":\n        text_block = next(b for b in response.content if b.type == \"text\")\n        print(text_block.text)\n        break\n\n    messages.append({\"role\": \"assistant\", \"content\": response.content})\n\n    tool_results = []\n    for block in response.content:\n        if block.type == \"tool_use\":\n            result = search_docs(**block.input)\n            tool_results.append({\n                \"type\": \"tool_result\",\n                \"tool_use_id\": block.id,\n                \"content\": json.dumps(result, ensure_ascii=False)\n            })\n    messages.append({\"role\": \"user\", \"content\": tool_results})\n```\n\n## Model Context Protocol (MCP)\n\nMCP is a **tool standardization protocol** proposed by Anthropic. It is not tied to any individual LLM SDK; tools are provided independently through a server–client architecture.\n\n```python\n# MCP 서버 구현\nfrom mcp.server import Server\nimport mcp.types as types\n\nserver = Server(\"my-tools-server\")\n\n@server.list_tools()\nasync def handle_list_tools():\n    return [\n        types.Tool(\n            name=\"query_database\",\n            description=\"SQL 쿼리를 실행하고 결과를 반환합니다\",\n            inputSchema={\n                \"type\": \"object\",\n                \"properties\": {\n                    \"sql\": {\"type\": \"string\", \"description\": \"실행할 SELECT 쿼리\"}\n                },\n                \"required\": [\"sql\"]\n            }\n        )\n    ]\n\n@server.call_tool()\nasync def handle_call_tool(name, arguments):\n    if name == \"query_database\":\n        results = execute_query(arguments[\"sql\"])\n        return [types.TextContent(type=\"text\", text=str(results))]\n```\n\nMCP's advantage is **reusability**. An MCP server you build once can be connected from Claude Desktop, Claude Code, your own agents, and more.\n\n## Tool Design Principles\n\nThe difference between a good tool and a bad one is in the **description**.\n\n| Bad example | Good example |\n|--------|--------|\n| \"Fetches data\" | \"Looks up status, amount, and shipping info for a specific order by order ID. Canceled orders can also be retrieved.\" |\n| No parameter descriptions | Explicit type, allowed values, and defaults for each parameter |\n\nThe LLM reads the description to choose a tool. If the description is inaccurate, it will call the wrong tool or pass the wrong arguments.\n\n## Parallel Tool Calls\n\nRunning multiple tools sequentially is slow. Both the OpenAI and Anthropic APIs support **parallel tool calls**, where the model calls several tools in one turn. On OpenAI, setting `parallel_tool_calls` to `false` limits it to at most one tool per turn ([OpenAI](https://developers.openai.com/api/docs/guides/function-calling), [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)).\n\n```python\nimport asyncio\n\nasync def execute_tools_parallel(tool_calls):\n    tasks = [dispatch_tool(tc.function.name, json.loads(tc.function.arguments))\n             for tc in tool_calls]\n    return await asyncio.gather(*tasks)\n```\n\nIn the next installment, we cover **memory system design**—how to let agents maintain conversation context and carry out long-running tasks.\n\n\n## Editor's Note — From the Field\n\nIt feels like attaching more tools should make an agent smarter, but in practice, once you go past five or six tools, the LLM frequently misjudges which tool to use and when. What helped most was cutting the number of tools and writing each description so specifically that a human wouldn't get confused either—`search_internal_docs` (search the internal wiki) rather than `search`. Tool design is an extension of prompt engineering.\n\n## Sources · checked 2026-10-04\n- [OpenAI — Function calling guide](https://developers.openai.com/api/docs/guides/function-calling) — `parallel_tool_calls`\n- [Anthropic — Tool use docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — parallel tool use\n- [Anthropic — Models overview](https://docs.anthropic.com/en/docs/about-claude/models/overview) — current model ID `claude-sonnet-5-5`\n- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)\n\nModel IDs change, so check the current ID on each provider’s model page before running the code.", "excerpt": "A complete breakdown of tool use, the core mechanism that lets LLM agents interact with the outside world. We compare OpenAI Function Calling, Anthropic Tool Use, and the Model Context Protocol (MCP) side by side with code."}, "verifiedAt": "2026-10-04", "changeSummary": "예제 코드의 지난 모델 ID(gpt-4o, claude-sonnet-4-6) 교체: Claude는 공식 모델 페이지의 현재 ID(claude-sonnet-5-5), OpenAI는 Chat Completions 지원 여부를 확인하지 못해 환경 변수로 지정. 병렬 툴 호출 서술을 OpenAI·Anthropic 공식 문서 기준으로 고치고 이전된 Anthropic 문서 주소 갱신, 출처·확인일 추가.", "officialSources": ["https://docs.anthropic.com/en/docs/about-claude/models/overview", "https://developers.openai.com/api/docs/guides/function-calling", "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=99 AND md5(content)='0df7c033bf3b35b9eb4881e51613d105' AND md5(content_evidence::text)='8b3cc8ee09a035852b1b7aaec57e66e9' AND md5(coalesce(array_to_string(tags,'|'),''))='1d3076dd4211bc22209a3349db90f5a3';
COMMIT;
