import mqttr = require('mqttr');
import ro = require('ro');
import {EventEmitter} from "events";

const PREFIX = '$pinest';

export interface Feature {
  node: string;
  role: string;
  client: ro.Client;
}

export interface Notification {
  topic: string;
  node: string;
  role: string;
  event: string;
  timestamp: Number;
  data?: any;
}

export class Client extends EventEmitter {

  protected _mqttr: mqttr.Client;
  protected _pinest;
  protected _features: Feature[];
  protected _subs;
  protected _ready: Promise<this>;
  protected _closed;

  static create(opts?) {
    return new Client(mqttr.connect(opts));
  }

  static async connect(opts?) {
    const client = Client.create(opts);
    await client.ready;
    return client;
  }

  get ready() {
    if (this._closed) {
      throw new Error('Connection is closed');
    }
    return this._ready;
  }

  protected constructor(mqttr: mqttr.Client) {
    super();
    this._mqttr = mqttr;
    this._ready = this.setup();
  }

  protected async setup(): Promise<this> {
    this._pinest = ro.client.mqtt(this._mqttr, PREFIX);
    const res = await this._pinest.remcall('features');
    if (!res || !res.result) {
      throw new Error('The pinest daemon is not ready');
    }
    const features = res.result;
    this._features = [];
    this._subs = [];
    for (const feature of features) {
      if (feature.supportedActions) {
        this._features.push({
          node: feature.node,
          role: feature.role,
          client: ro.client.mqtt(this._mqttr, `${PREFIX}/${feature.node}/${feature.role}`)
        });
      }
      if (feature.supportedEvents) {
        this.subscribe(`${PREFIX}/${feature.node}/${feature.role}/event`, `${feature.node}:${feature.role}`);
        this.subscribe(`${PREFIX}/${feature.node}/event`, `${feature.node}`);
      }
    }
    return this;
  }

  protected subscribe(topic, event) {
    if (this._subs[topic] || !this._mqttr) {
      return;
    }

    this._subs[topic] = this._mqttr.subscribe(topic, message => {
      this.emit(event, message.payload);
      this.emit('notify', message.payload);
    });
  }

  checkActivity() {
    if (this._closed) {
      throw new Error('closed');
    }
  }

  close() {
    if (this._mqttr) {
      this._mqttr.end(true);
    }
    this._pinest = undefined;
    this._closed = true;
  }

  feature(node: string, role?: string): ro.Client | undefined {
    this.checkActivity();
    for (const feature of this._features) {
      if (feature.node === node && (!role || role === feature.role)) {
        return feature.client;
      }
    }
  }
}
