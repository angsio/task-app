ildar@jetson:~$ ollama ps
NAME                       ID              SIZE      PROCESSOR    CONTEXT    UNTIL
nomic-embed-text:latest    0a109f422b47    595 MB    100% GPU     2048       Forever
qwen3:4b-instruct          0edcdef34593    3.6 GB    100% GPU     4096       Forever

Example:
curl 'http://jetson.myraspberrypi.lan:11434/api/chat' -d '{"model": "qwen3:4b-instruct","stream": false, "messages": [{"role": "user", "content":"hello world"}]}'

{
    "model": "qwen3:4b-instruct",
    "created_at": "2026-07-07T04:53:30.143165796Z",
    "message": 
        {
            "role": "assistant",
            "content": "Hello, World! 🌟  \nIt's great to meet you! How can I assist you today? 😊"
        },
    "done": true,
    "done_reason": "stop",
    "total_duration": 2046703063,
    "load_duration": 314327013,
    "prompt_eval_count": 10,
    "prompt_eval_duration": 113041811,
    "eval_count": 25,
    "eval_duration": 1591073397
}
    
ildar@pop-os:~/projects/amir-llm$ curl 'http://jetson.myraspberrypi.lan:11434/api/chat' -d '{"model": "qwen3:4b-instruct","stream": false, "messages": [{"role": "user", "content":"hello world"}]}