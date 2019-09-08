# pinestc

[![Greenkeeper badge](https://badges.greenkeeper.io/taoyuan/pinestc.svg)](https://greenkeeper.io/)

> The pinest nodejs client

## Usage

```js
const {Client} = require('pinestc');

(async () => {
  const client = await Client.connect();
  client.on('button', notification => {
    console.log(notification);
    /* => button click once
    { topic: '/button/event',
      node: 'button',
      role: 'mode',
      event: 'down',
      timestamp: 1543844844013 }
    { topic: '/button/event',
      node: 'button',
      role: 'mode',
      event: 'press',
      timestamp: 1543844844013 }
    { topic: '/button/event',
      node: 'button',
      role: 'mode',
      event: 'up',
      timestamp: 1543844844128 }
    { topic: '/button/event',
      node: 'button',
      role: 'mode',
      event: 'release',
      timestamp: 1543844844128 }
     */
  });
  const feature = client.feature('ledrgb');
  if (!feature) {
    throw new Error('no feature ledrgb');
  }
  await feature.remcall('fadeout', ['0000FF']);
  // close if no other process
  // client.close();
})();
```
