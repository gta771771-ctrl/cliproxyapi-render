const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const V0_API_KEY = process.env.V0_API_KEY;

// 记录请求日志（用于对账）
const requestLogs = [];

app.post('/v1/chat/completions', async (req, res) => {
  const startTime = Date.now();
  const userMessage = req.body.messages.find(m => m.role === 'user')?.content;
  const model = req.body.model || 'v0-max-fast';

  if (!userMessage) {
    return res.status(400).json({ error: '请求中未找到用户消息' });
  }

  try {
    // 向 v0 API 发送请求
    const v0Response = await axios.post(
      'https://api.v0.dev/v1/chats',
      {
        message: userMessage,
        model: model
      },
      {
        headers: {
          'Authorization': `Bearer ${V0_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 记录请求日志
    const log = {
      id: Date.now().toString(),
      model: model,
      prompt: userMessage,
      response: v0Response.data.response || '',
      tokens: v0Response.data.usage?.total_tokens || 0,
      time: Date.now() - startTime,
      status: 'success'
    };
    requestLogs.push(log);

    // 转换成 OpenAI 格式返回
    res.json({
      id: log.id,
      object: 'chat.completion',
      created: Math.floor(startTime / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: log.response
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: v0Response.data.usage?.prompt_tokens || 0,
        completion_tokens: v0Response.data.usage?.completion_tokens || 0,
        total_tokens: log.tokens
      }
    });
  } catch (error) {
    console.error('请求错误:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || '内部服务器错误'
    });
  }
});

// 提供日志查询接口（可选）
app.get('/logs', (req, res) => {
  res.json(requestLogs);
});

app.listen(PORT, () => {
  console.log(`中转服务已启动，端口：${PORT}`);
});