# polestar

My opinionated system utility application.

## Notes

Setting up polestar may require extra configuration on your end:
- Ruby must be installed, along with the Gems `ruby-dbus` and `chunky_png`
- `xdotool` and `xprop` must be available
- [kado](https://github.com/chocycat/kado) and [cbd](https://github.com/chocycat/cbd) must be available
- Move a profile picture to `public/img/pfp.png`
- The dictionary feature will not work (and will likely crash the application) unless `resources/dictionary.db` exists. This can be dumped and converted from the macOS dictionary application. The expected database format is: `definitions.id|definitions.title|definitions.entry`.
- Polestar depends a lot on custom awesomeWM functionality, so using it on another WM will prove to be difficult, unless you reimplement all of the features.