export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    // GitHub'a yönlendir
    const clientId = process.env.OAUTH_CLIENT_ID;
    return res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`
    );
  }

  // GitHub'dan dönen kodu token ile değiştir
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "json",
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenResponse.json();
    const token = data.access_token;

    // CMS'e token'ı gönderen HTML script'i döndür
    const script = `
      <!doctype html>
      <html>
        <head>
          <script>
            const receiveMessage = (message) => {
              window.opener.postMessage(
                'authorization:${"github"}:success:${JSON.stringify({ token })}',
                window.origin
              );
              window.close();
            }
            window.onload = () => {
              receiveMessage();
            }
          </script>
        </head>
        <body>
          <p>Giriş başarılı, pencere kapatılıyor...</p>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    return res.send(script);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
