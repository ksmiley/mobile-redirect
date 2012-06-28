# Mobile Redirector

Small script for quickly redirecting a user to the correct view of a page based on the browser or device being used. Designed to not only send users on mobile devices to a lightweight version of a site, but to also do the opposite and redirect desktop users who access the mobile site.

The script is small (less than 2k minified) and has zero dependencies. It's meant to be loaded very early on the page so the redirect can appear to happen instantly.

(c) 2012, Morris DigitalWorks

## Using

Customize this snippet as needed and place in the `<head>` section on all variations of a site (mobile site, desktop site, etc.):

    <script src="/js/mobile-redirect.min.js"></script>
    <script>mdw.MobileRedirect.bounce('desktop');</script>

If you're lucky and your site is structured exactly like ours, then that's all you need. But more than likely you'll want to change some properties first. It'll help to know what the script looks for.

## Moving Parts

The `bounce` function is the main entry point for the script and will redirect the browser if needed. It doesn't require any arguments to run as long as all the configuration is set, but for convenience it can take one or two arguments with the most common options.

On each page, the redirector script needs to know three things:

  * Where the user is (the current view).
  * Where the user should be (the target view).
  * How to get from here to there (the translate callback).

## Customizing

While the code can be used as-is, you'll get the most benefit from customizing the `sleuth` and `translate` functions for your needs and re-minifying the script. The minified version in the repo was compressed using [UglifyJS](https://github.com/mishoo/UglifyJS), though other Javascript minifiers should work, too.