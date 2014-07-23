"use strict";

var fs = require("fs");
var path = require("path");
var mime = require("mime");

var components = {
  xml: "xml",
  html: "xml",
  css: "css",
  scss: "css"
};

module.exports = function(builder) {
  builder.hook("before templates", function(pkg, callback) {
    if (pkg.config.templates) {
      pkg.config.templates.forEach(function(file) {
        var base64 = transformToBase64(file);

        pkg.removeFile("templates", file);
        pkg.addFile("templates", file, base64);

        callback();
      });
    } else {
      callback();
    }
  });


  builder.hook("before styles", function(pkg, callback) {
    if (pkg.config.styles) {
      pkg.config.styles.forEach(function(file) {
        var base64 = transformToBase64(file);

        pkg.removeFile("styles", file);
        pkg.addFile("styles", file, base64);

        callback();
      });
    } else {
      callback();
    }
  });

  function transformToBase64(fileName) {
    var regex = null;

    var componentName = components[fileName.split(".").pop()];

    switch (componentName) {
      case "css":
        regex = /((url)\s*\(\s*)(?:"([^"]*)"|'([^']*)'|([\w\-.:]+))\)/g;

        break;
      case "xml":
        regex = /((src|xlink\:href)+\s*=\s*)(?:"([^"]*)"|'([^']*)'|([\w\-.:]+))/g;

        break;
    }

    var data = fs.readFileSync(fileName).toString();

    return data.replace(regex, function() {
      var resourceName = arguments[3];

      if (!resourceName.match(/^#|^data:$/)) {
        try {

          resourceName = decodeURIComponent(path.resolve(path.dirname(fileName), resourceName));

          var buffer = fs.readFileSync(resourceName);
          var mimeType = mime.lookup(resourceName);
          var dataURIBase64Data = buffer.toString("base64");

          if (componentName === "css") {
            if (mimeType === "image/svg+xml") {
//                var hash = _match[2].match(/#.+/);
//                var filteredData = buffer.toString().replace(/\n/g, "").replace(/\s+/g, " ");
//                dataURI = "url(\"data:" + mimeType + "," + encodeURIComponent(filteredData) + (hash.length ? hash[0] : "") + "\")";
            } else {
              return "url(\"data:" + mimeType + ";base64," + dataURIBase64Data + "\")";
            }
          } else if (componentName === "xml") {
            return arguments[1] + "\"" + "data:" + mimeType + ";base64," + dataURIBase64Data + "\"";
          }

          return resourceName;
        } catch (e) {
          console.error(e.message);

          return arguments[0];
        }
      }
    });
  }
};
