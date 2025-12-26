# Polestar

My opinionated system utility application.

## Prerequisites

- Ruby must be installed, along with the Gems `ruby-dbus` and `chunky_png`
- `xdotool` and `xprop` must be available
- An IPC socket that relays information about your WM environment must be present. [See a reference implementation for this.](https://github.com/chocycat/dotfiles/blob/main/awesome/environment/ipc.lua)

## Notes

Setting up Polestar may require extra configuration on your end:

- To enable clipboard history, [cbd](https://github.com/chocycat/cbd) must be available.
- If you want to use the bar, it is recommended to use [kado](https://github.com/chocycat/kado). [See the reference configuration.](https://github.com/chocycat/dotfiles/blob/main/kado.toml)
- The dictionary feature will not work unless `resources/dictionary.db` exists. [This can be dumped and converted from macOS dictionary files.](https://github.com/JadedTuna/apple-dictionary)
  - If you plan on using another dictionary and wish to do the conversion yourself, the expected database format is: `definitions.id|definitions.title|definitions.entry`.
