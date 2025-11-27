#!/usr/bin/env ruby

require 'dbus'
require 'json'
require 'chunky_png'
require 'base64'

bus = DBus::SessionBus.instance
service = bus.request_service('org.freedesktop.Notifications')
$counter = 0

class Service < DBus::Object
  dbus_interface 'org.freedesktop.Notifications' do
    dbus_method :Notify, 'in app_name:s, in replaces_id:u, in app_icon:s, in summary:s, in body:s, in action:as, in hints:a{sv}, in expire_timeout:i, out id:u' do |app_name, replaces_id, app_icon, summary, body, actions, hints, expire_timeout|
      notification_id = $counter
      $counter += 1

      buttons = []
      (0...actions.length).step(2) do |i|
        buttons << { id: actions[i], label: actions[i + 1] }
      end

      data = {
        type: 'notification',
        id: notification_id,
        app_name:,
        replaces_id:,
        icon: app_icon,
        summary:,
        body:,
        actions: buttons,
        hints:,
        timeout: expire_timeout
      }

      if hints['image-data']
        width, height, rowstride, has_alpha, bits_per_sample, channels, pixel_data = hints['image-data']

        png = ChunkyPNG::Image.new(width, height)

        pixel_data.each_slice(channels).with_index do |pixel, i|
          x = i % width
          y = i / width

          if has_alpha
            r, g, b, a = pixel
            png[x, y] = ChunkyPNG::Color.rgba(r, g, b, a)
          else
            r, g, b = pixel
            png[x, y] = ChunkyPNG::Color.rgb(r, g, b)
          end
        end

        png_data = png.to_blob
        b64 = Base64.strict_encode64(png_data)

        data[:image] = "data:image/png;base64,#{b64}"
      end

      puts JSON.generate(data)
      $stdout.flush

      notification_id
    end

    dbus_method :CloseNotification, 'in id:u' do |id|
      data = { type: 'close', id: }
      puts JSON.generate(data)
      $stdout.flush
    end

    dbus_method :GetCapabilities, 'out caps:as' do
      [['actions', 'body', 'body-markup', 'icon-static', 'persistence']]
    end

    dbus_method :GetServerInformation, 'out name:s, out vendor:s, out version:s, out spec_version:s' do
      ['polestar', 'chocycat', '1.0', '1.2']
    end

    dbus_signal :ActionInvoked, 'id:u, action_key:s'
    dbus_signal :NotificationClosed, 'id:u, reason:u'
  end
end

obj = Service.new('/org/freedesktop/Notifications')
service.export(obj)

Thread.new do
  while line = $stdin.gets
    begin
      data = JSON.parse(line)

      if data['type'] == 'action'
        obj.ActionInvoked(data['id'], data['action_id'])
      elsif data['type'] == 'closed'
        obj.NotificationClosed(data['id'], data['reason'] || 2)
      end
    rescue =>e 
      $stderr.puts "Error: #{e.message}"
    end
  end
end

main = DBus::Main.new
main << bus
main.run
