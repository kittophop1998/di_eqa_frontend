"use client";

import { getWsURL } from "./api";

export type WSMessage = { type: string; payload?: any };

export class LiveSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private rooms = new Set<string>();
  private listeners: Array<(msg: WSMessage) => void> = [];
  private reconnectTimer: number | null = null;
  private closed = false;

  constructor(url?: string) {
    this.url = url || getWsURL();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error("ws connect error", e);
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      for (const r of this.rooms) {
        this.ws?.send(JSON.stringify({ type: "join", room: r }));
      }
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WSMessage;
        this.listeners.forEach((l) => l(msg));
      } catch {}
    };
    this.ws.onclose = () => {
      if (!this.closed) this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  join(room: string) {
    this.rooms.add(room);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "join", room }));
    }
  }

  leave(room: string) {
    this.rooms.delete(room);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "leave", room }));
    }
  }

  on(listener: (msg: WSMessage) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  close() {
    this.closed = true;
    this.ws?.close();
  }
}
