# Iris Docs

Iris Docs is a proof-of-concept collaborative tool featuring docs, canvas and an explorer for the underlying [IrisDB](https://github.com/irislib/irisdb) data structure.

Accounts are public keys: you can create them at will, and no one can take away your account. Your data is synced over Nostr relays and also stored locally in your browser.

Users can freely choose whose edits to a document they want to see. For example, editors can be a list of users curated by the document's creator, or it could be everyone you follow on Nostr. You can always fork someone else's document and change the list of editors you want to see.

This is especially useful in use cases like wikis, where all users might not trust the same authors. It avoids the centralization of power to a handful of moderators, and ultimately the owner of some domain name.

The underlying IrisDB can be used to easily create all kinds of decentralized applications. https://github.com/irislib/irisdb

For text document sync, we use https://github.com/yjs/yjs

Deployed on [docs.iris.to](https://docs.iris.to/)

## create-iris
This project is also a template for quickly getting started with [IrisDB](https://github.com/irislib/irisdb) & [Nostr](https://nostr.com) web application development.

It has basic building blocks like app routing, navigation, authentication, network settings, social networking and
IrisDB usage examples.

```
npm create iris@latest
```

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/irislib/iris-docs)

## Stack
* [Vite](https://vitejs.dev/) - Build and development environment
* [React](https://react.dev/)
* [IrisDB](../README.md)
* [Tailwind](https://tailwindcss.com/docs/installation)
* [DaisyUI](https://daisyui.com/)
* [NDK](https://github.com/nostr-dev-kit/ndk) for syncing data over [Nostr](https://nostr.com)
* [yjs](https://github.com/yjs/yjs) for collaborative text documents
* [TipTap](https://github.com/ueberdosis/tiptap) for collaborative rich text documents
* [Remix Icon](https://remixicon.com/) for icons

## Development
```sh
npm install
npm run dev
```