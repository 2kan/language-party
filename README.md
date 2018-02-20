# Language Party!

This is a web app I made over a couple of days because I was frustrated at how slow [TranslationParty](http://www.translationparty.com/) is to translate phrases. I also wanted to try languages other than Japanese.

You can see a live version of this over on the site I set up for it here: [Langualibirum](langualibrium.com). It's a play on words of "language" and "equilibrium" 😜

## Installation

This part is pretty simple, just clone the repo:
```sh
git clone https://github.com/2kan/language-party.git
```

Transpile the pug files:
```sh
pug public/.
```

And launch the app:
```sh
node translation-party
```

If you're running on a linux prod environment, you might need to setup a symlink from `nodejs` to `node` unless you've installed the legacy package of node, and you may also need to run node with the `--harmony_array_includes` flag.