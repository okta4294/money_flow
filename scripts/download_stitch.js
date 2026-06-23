const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = {
  'dashboard_mobile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzBhNGU4YjU2ZWRjODRkYjBiOTE2MzVjZDZhYTQ4Y2IyEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'history_mobile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzViMDkwNDI2MGQ4YjQ2YTA4YTgzNzQ1MmMxN2M1NTU3EgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'hutang_mobile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzE0OWZkNjA4ZTI3ZjRlNzU5OTMzOWFjMjc1NmRkYWEwEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'kategori_mobile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzU3YzNlZGVlOTI5ZjQ3YmE5ODE3YTUyZTk0NmMyMTJkEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'dashboard_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzYzMGI0ZGE2YWZlMjQ2NmM5Y2ExNWIzZmEzZWVmMzllEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'history_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2IyYWJmNDI4MDg3NjQ0Mzg5OGE3NTczZjViMjEyYThjEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'kategori_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzQwM2U3YWE2YjdhZDQ2NGZiODhmNGVhMTJhODNmYTMyEgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086',
  'hutang_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NjODkzZDZlZGRhZjRjODk4Y2ExNjllYTk2ZDllZjk4EgsSBxCu1NL6rRIYAZIBIwoKcHJvamVjdF9pZBIVQhM2NjE0MTg4NTg4OTA5NzEwNjE3&filename=&opi=89354086'
};

const dir = path.join(__dirname, 'stitch_exports');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

Object.entries(urls).forEach(([filename, url]) => {
  https.get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      https.get(res.headers.location, (res2) => {
        const file = fs.createWriteStream(path.join(dir, filename));
        res2.pipe(file);
      });
    } else {
      const file = fs.createWriteStream(path.join(dir, filename));
      res.pipe(file);
    }
  });
});
