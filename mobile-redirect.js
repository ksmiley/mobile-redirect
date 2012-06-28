// $Id$
/**
 * @fileOverview
 *   Framework for maintaining multiple views of a page optimized for different
 *   devices and switching between them based on user preference.
 * @version v2011.1.0
 */

/**
 * @namespace Methods and settings for redirecting between multiple views of a page.
 */
window.mdw = window.mdw || {};
mdw.MobileRedirect = mdw.MobileRedirect || {};

(function(m){
  //"use strict";

  // Alias common variables so the script minifies better.
  var doc = document,
      loc = location,
      encURIComponent = encodeURIComponent,
      current = m.current = {
        /**
         * View that the current page represents. This is a configuration option and
         * must be set before calling the check function.
         */
        view: '',
        /**
         * URL of the current page. Usually set automatically, but can be overridden.
         */
        url: loc.href
      },
      target = m.target = {
        /**
         * View that the browser should receive. This is usually set by the check
         * method. If it differs from the currentView, then the URL translator will
         * run and the browser will be redirected to targetUrl.
         */
        view: '',
        /**
         * URL to send the browser to if currentView does not match targetView. This
         * is usually set by one of the URL translate functions.
         */
        url: ''
      },
      view = 'view',
      url = 'url';

  /**
   * Set defaults for cookies and other settings by examining the browser
   * environment.
   *
   * Uses a function instead of a literal object so cookie settings can be 
   * determined dynamically.
   *
   * @field
   */
  m.settings = (function() {
    var s = {
      cookie: {
        name: 'mdwview',
        lifetime: 365,   //< Max age, in days. Default is one year.
        domain: '',
        path: '/',
        secure: (loc.protocol === 'https:') ? true : false
      }
    };
    if (loc.hostname) {
      // Default the cookie domain to the current domain, ignoring any
      // subdomains. This is a very simple approach and will only work correctly
      // with single-level TLDs. e.g. ".com" will work, ".co.uk" won't.
      var parts = loc.hostname.split('.').reverse();
      if (parts.length > 1) {
        s.cookie.domain = '.' + parts[1] + '.' + parts[0];
      }
    }
    return s;
  })();

  /**
   * Stub for a function that determines the URL of the target view given the
   * current page's view.
   *
   * If the function needs the current page's URL, it should fetch it from the
   * browser's window.location object.
   *
   * This function will only be called when the target and current views are
   * different.
   *
   * @param {String} targetView
   *   The view that the browser should be seeing.
   * @param {String} currentView
   *   The view of the current page.
   *
   * @returns {String}
   *   The URL to redirect the browser to, or blank if a new URL can't be 
   *   determined and the current URL should be used.
   */
  m.translate = function(targetView, currentView) { return false; };

  /**
   * Stub for a function that examines the current browser environment and
   * determines which view it should get.
   *
   * Takes no parameters because it should use various browser-provided
   * properties as inputs. This method will likely be called very early in the
   * page load, so it should not expect the page DOM to be available.
   *
   * @returns {String}
   *   The view name, such as 'desktop', 'mobile', 'tablet', etc.
   */
  m.sleuth = function() { return ''; };

  /**
   * Determine whether the user is getting the correct view of the page based
   * on their preferences and browser. If not, redirect to the correct view.
   *
   * Since this is the main function for the script, it supports a shortcut
   * form of setting up this script by letting the most common options be
   * passed as arguments. The current view and/or the translate function can
   * be passed as arguments. If both are given, the current view must come
   * first.
   *
   * @param {String} currentView
   *   Shortcut to set mdw.MobileRedirect.current.view.
   * @param {Function} translateCallback
   *   Shortcut to set mdw.MobileRedirect.translate.
   *
   * @example
   * bounce()
   * bounce('mobile')
   * bounce(function(tv, cv) { ... })
   * bounce('mobile', function(tv, cv) { ... });
   */
  m.bounce = function(currentView, translateCallback) {
    // Aliases to make the code minify better.
    var argLength = arguments.length,
        translate = 'translate',
        func = 'function';

    // Support shortcut arguments.
    if (argLength > 0) {
      if (typeof currentView == func) {
        m[translate] = currentView;
      } else {
        current[view] = currentView;
      }
      if (argLength == 2 && typeof translateCallback == func) {
        m[translate] = translateCallback;
      }
    }

    // Bail out if there's not enough information about the current page.
    if (!current[view] || !current[url]) {
      return;
    }

    // Determine the target view. It is usually detected but can be preset.
    // If not preset, try to read a preferred view from a cookie.
    target[view] = target[view] || m.getPreferred();
    // If not preset and no cookie, try to detect the best view for the current
    // device or browser.
    if (!target[view]) {
      // sleuth function is less trusted because it's defined elsewhere, so
      // make sure it doesn't break the page.
      try {
        target[view] = m.sleuth();
      } catch (e) {
        return;
      }
      // Set cookie if a view was detected, so the auto-detect doesn't have to
      // run next time.
      if (target[view]) {
        m.setPreferred(target[view]);
      } 
    }
    // Don't try to redirect if a view can't be determined, or if the page is
    // already the correct view.
    if (!target[view] || current[view] == target[view]) {
      return;
    }

    // translate function is less trusted because it's defined elsewhere, so
    // make sure it doesn't break the page.
    try {
      target[url] = m[translate](target[view], current[view]);
    } catch (e) {
      return;
    }
    // Point the browser to the target URL if one was found.
    if (target[url]) {
      // Use replace so the unwanted view doesn't end up in the history.
      loc.replace(target[url]);
    }
    // If the code gets this far, no redirect will happen.
  };

  /**
   * Retrieve the user's preferred view, if set.
   */
  m.getPreferred = function() {
    return readViewCookie();
  }

  /**
   * Change the user's preferred view.
   *
   * @param {String} view
   */
  m.setPreferred = function(preferredView) {
    if (preferredView) {
      setViewCookie(preferredView);
    }
  }

  /**
   * Change the user's preferred view and immediately redirect to it.
   *
   * @param {String} view
   */
  m.switchPreferred = function(preferredView) {
    // Reset any previously computed target.
    target[view] = target[url] = '';
    // Update preference and attempt the redirect.
    m.setPreferred(preferredView);
    m.bounce();
  }

  /**
   * Reset the user's preferred view to the default.
   *
   * The preference is immediately emptied, but it might not get reset to the
   * default until the next page load.
   */
  m.clearPreferred = function() {
    setViewCookie('');
  }

  /**
   * Helper function to parse the cookie string for the view preference.
   *
   * @returns {String}
   *   Contents of the cookie, or null if not found.
   *
   * @private
   */
  function readViewCookie() {
    // Cookie-fetching regexp taken from jQuery cookie plugin.
    // https://github.com/carhartl/jquery-cookie/blob/master/jquery.cookie.js
    var result, key = m.settings.cookie.name;
    if (!key) return;
    return (result = new RegExp('(?:^|; )' + encURIComponent(key) + '=([^;]*)').exec(doc.cookie)) ? decodeURIComponent(result[1]) : null;
  }

  /**
   * Helper function to save or delete a cookie with the view preference.
   *
   * @param {String} view
   *   Value to save with the cookie. If this is blank or evaluates to false,
   *   the cookie will be deleted.
   *
   * @private
   */
  function setViewCookie(value) {
    var cs = m.settings.cookie,
        // Reset flag puts the expires time 24 hours in the past.
        expire = (value ? cs.lifetime : -1),
        cookie = encURIComponent(cs.name) + '=' + encURIComponent(value);
    if (expire) {
      var d = new Date();
      d.setDate(d.getDate() + expire);
      cookie += ';expires=' + d.toUTCString();
    }
    if (cs.domain) cookie += ';domain=' + cs.domain;
    if (cs.path)   cookie += ';path=' + cs.path;
    if (cs.secure) cookie += ';secure';
    doc.cookie = cookie;
  }
})(mdw.MobileRedirect);

/**
 * Implementation of browser sniffer. Uses regular expressions to look for 
 * common mobile, tablet, and desktop browsers. If none of the patterns
 * match, it treats a small screen as mobile and otherwise default to 
 * desktop.
 *
 * @returns {String}
 *   One of 'mobile', 'tablet' or 'desktop'.
 */
mdw.MobileRedirect.sleuth = function() {
  var ua = navigator.userAgent.toLowerCase();
  if (/\b(?:iphone|ipod|iemobile|blackberry|webos|opera\s*mini|opera\s*mobile|fennec|symbian\s*os|maemo|skyfire)\b|^blackberry\d/.test(ua) || (/\bandroid\b/.test(ua) && /\bmobile\b/.test(ua))) return 'mobile';
  if (/\b(?:ipad|android|playbook|tablet\s*pc|touchpad)\b/.test(ua)) return 'tablet';
  if (/\b(?:msie|firefox|chrome|opera|safari|khtml|opera)\b/.test(ua)) return 'desktop';
  if (screen.width <= 800) return 'mobile';
  return 'desktop';
};

/**
 * Example translate callback for a mobile site that adds an "m." prefix to
 * the domain but otherwises uses the same URLs.
 *
 * This sends tablets to the desktop site, though that can be easily changed
 * to send them to mobile or accomodate a separate tablet view.
 */
mdw.MobileRedirect.translate = function(targetView, currentView) {
  return location.href.replace(/^(https?:\/\/)(m\.)?(.+)/i, (targetView == 'mobile' ? '$1m.$3' : '$1$3'));
}
