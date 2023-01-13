JSON.stringify(Array.from(document.querySelectorAll("a[href*='/cards/']")).map(a=>a.href.split("/").pop()))



temp1.data.map(e=>e.name.toLowerCase().replaceAll(/'/g, "").replaceAll(/[\W]+/g, "-"))




chulane.map(n=> temp1.data.find(e=>e.shortName==n)||n )
chulane.map(n=> temp1.data.find(e=>e.shortName==n)).filter(e=>!!e)




  "permissions": [
    "storage"
  ],
  "options_ui": {
    "page": "options.html",
    "open_in_tab": false
  },