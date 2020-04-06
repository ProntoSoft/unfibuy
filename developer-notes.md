## userscript vs chrome extension

https://stackoverflow.com/a/13490019/1314403


Layout should just be

```
manifest.json
whatever.user.js
```

With a minimal manifest.json:

```
{
     "name": "name of extension",
     "version": "1",
     "manifest_version": 2,
     "content_scripts": [{
         "js": ["whatever.user.js"],
         "matches": ["http://example.com/*"]
      }]
```
