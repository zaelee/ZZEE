import { clamp, W, H } from './game-core.mjs';

// Each contact owns one ship until released. Touching never teleports a ship.
export class TouchControls {
  constructor() { this.contacts = new Map(); }
  begin(id, point, players) {
    if (this.contacts.has(id)) return;
    const occupied = new Set([...this.contacts.values()].map(t => t.player));
    const player = players.find(p => p.lives > 0 && !occupied.has(p.id));
    if (player) this.contacts.set(id, { player: player.id, last: point, x: player.x, y: player.y });
  }
  move(id, point) {
    const touch = this.contacts.get(id);
    if (!touch) return;
    touch.x = clamp(touch.x + point.x - touch.last.x, 25, W - 25);
    touch.y = clamp(touch.y + point.y - touch.last.y, 34, H - 28);
    touch.last = point;
  }
  end(id) { this.contacts.delete(id); }
  clear() { this.contacts.clear(); }
  input(player) {
    const touch = [...this.contacts.values()].find(t => t.player === player);
    return touch ? { x: touch.x, y: touch.y, fire: true } : null;
  }
}
