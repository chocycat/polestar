import { execSync } from "node:child_process";

export function dockWindow(title: string, map = false) {
  const id = execSync(`xdotool search --name '${title}'`);
  execSync(
    `xprop -id '${id}' -f _NET_WM_WINDOW_TYPE 32a -set _NET_WM_WINDOW_TYPE _NET_WM_WINDOW_TYPE_DOCK`
  );
  execSync(
    `xprop -id '${id}' -f _NET_WM_STATE 32a -set _NET_WM_STATE '_NET_WM_STATE_STICKY, _NET_WM_STATE_ABOVE'`
  );
  execSync(
    `xprop -id '${id}' -f _NET_WM_DESKTOP 32a -set _NET_WM_DESKTOP '0xffffffff'`
  );
  execSync(`xdotool search --name '${title}' windowunmap`);

  if (map) {
    execSync(`xdotool search --name '${title}' windowmap`);
  }
}

