const { app, BrowserWindow, shell } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

let localServer;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function startLocalServer() {
  if (localServer?.listening) return Promise.resolve(localServer.address().port);

  return new Promise((resolve, reject) => {
    localServer = http.createServer((request, response) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      } catch {
        response.writeHead(400);
        response.end("Bad request");
        return;
      }

      const requestedPath = pathname === "/"
        ? path.join(__dirname, "index.html")
        : path.resolve(__dirname, `.${pathname}`);
      const relativePath = path.relative(__dirname, requestedPath);

      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      fs.stat(requestedPath, (statError, stats) => {
        if (statError || !stats.isFile()) {
          response.writeHead(statError?.code === "ENOENT" ? 404 : 400);
          response.end("Not found");
          return;
        }

        fs.readFile(requestedPath, (readError, data) => {
          if (readError) {
            response.writeHead(500);
            response.end("Could not read file");
            return;
          }
          response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(requestedPath).toLowerCase()] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store"
          });
          response.end(data);
        });
      });
    });

    localServer.once("error", reject);
    localServer.listen(48123, "127.0.0.1", () => resolve(48123));
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0b1112",
    title: "AFTERSIGNAL — A Black Mesa Incident",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(`http://127.0.0.1:${port}/`);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.setAppUserModelId("com.fanproject.aftersignal");

app.whenReady().then(async () => {
  const port = await startLocalServer();
  createWindow(port);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
}).catch(error => {
  console.error("Unable to start AFTERSIGNAL:", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  localServer?.close();
});
