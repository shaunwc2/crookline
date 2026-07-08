/*
 * Seasonal Pinterest Board Embed
 * -------------------------------
 * Drops a Pinterest board embed into #pinterest-board-container, picking the
 * board automatically based on the visitor's local date. No backend, no API
 * key — uses Pinterest's free client-side widget (pinit.js).
 *
 * SETUP — edit these lines:
 */
const PINTEREST_USERNAME = 'beamcc31'; // Pinterest handle, no @ and no slashes
const FALLBACK_BOARD = 'nails';        // evergreen catch-all board, used if the seasonal one fails to load
const USE_SEASONAL_BOARDS = false;     // set true once winter/spring/summer/fall boards exist under PINTEREST_USERNAME

(function () {
  const CONTAINER_ID = 'pinterest-board-container';
  const WIDGET_TIMEOUT_MS = 4000; // how long to wait for the seasonal board to render before falling back
  const MIN_BOARD_WIDTH = 300;
  const MAX_BOARD_WIDTH = 900; // matches the site's main content max-width so it never overflows on desktop

  // --- Season detection -----------------------------------------------
  // Based on the VISITOR'S local device clock (no server, no timezone lookup).
  // Month numbers are 0-indexed (0 = Jan ... 11 = Dec). Adjust the ranges
  // below if you want the season boundaries to shift.
  function getSeason(date) {
    const month = date.getMonth();
    if (month === 11 || month === 0 || month === 1) return 'winter'; // Dec, Jan, Feb
    if (month >= 2 && month <= 4) return 'spring';                   // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer';                   // Jun, Jul, Aug
    return 'fall';                                                   // Sep, Oct, Nov
  }

  function boardUrl(boardName) {
    return 'https://www.pinterest.com/' + PINTEREST_USERNAME + '/' + boardName + '/';
  }

  // Pinterest's board widget takes a fixed pixel width (no native "100%"
  // option), so we measure the container and pass that in as the width.
  function getBoardWidth(container) {
    const available = container.clientWidth || window.innerWidth;
    return Math.max(MIN_BOARD_WIDTH, Math.min(MAX_BOARD_WIDTH, Math.floor(available)));
  }

  // Builds the anchor tag Pinterest's widget script looks for and converts
  // into an embedded board (see https://developers.pinterest.com/docs/widgets/boards/).
  function buildEmbedAnchor(boardName, width) {
    const a = document.createElement('a');
    a.setAttribute('data-pin-do', 'embedBoard');
    a.setAttribute('data-pin-board-width', String(width));
    a.setAttribute('data-pin-scale-height', String(Math.round(width * 0.6))); // keeps the 400/240 aspect ratio
    a.setAttribute('data-pin-scale-width', '100'); // max thumbnail size Pinterest allows
    a.href = boardUrl(boardName);
    return a;
  }

  function loadPinterestScript(onReady) {
    const existing = document.getElementById('pinterest-widget-script');
    if (existing) {
      onReady();
      return;
    }
    const script = document.createElement('script');
    script.id = 'pinterest-widget-script';
    script.async = true;
    script.src = 'https://assets.pinterest.com/js/pinit.js';
    script.onload = onReady;
    script.onerror = onReady; // still run the fallback check even if the script itself fails
    document.body.appendChild(script);
  }

  let currentBoardName = null;
  let currentIsFallback = false;

  function renderBoard(boardName, isFallback) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    currentBoardName = boardName;
    currentIsFallback = isFallback;

    container.innerHTML = '';
    container.appendChild(buildEmbedAnchor(boardName, getBoardWidth(container)));

    loadPinterestScript(function () {
      // Pinterest's script scans the DOM for data-pin-do anchors on load.
      // If it already ran before this anchor existed, ask it to re-scan.
      if (window.PinUtils && typeof window.PinUtils.build === 'function') {
        window.PinUtils.build();
      }

      if (isFallback) return; // already showing the fallback board, nothing left to check

      // Pinterest replaces the <a> with an <iframe> when the embed succeeds.
      // If that hasn't happened (board missing/empty/blocked) within the
      // timeout, fall back to the evergreen board.
      setTimeout(function () {
        const iframe = container.querySelector('iframe');
        const rendered = iframe && iframe.offsetHeight > 0;
        if (!rendered) {
          renderBoard(FALLBACK_BOARD, true);
        }
      }, WIDGET_TIMEOUT_MS);
    });
  }

  // Pinterest's widget is a fixed pixel size once built, so on resize
  // (rotating a phone, resizing a browser window) we rebuild it at the new
  // container width. Debounced since resize fires continuously.
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (currentBoardName) {
        renderBoard(currentBoardName, currentIsFallback);
      }
    }, 300);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (USE_SEASONAL_BOARDS) {
      renderBoard(getSeason(new Date()), false);
    } else {
      // Seasonal boards aren't set up yet — go straight to the fallback
      // board so visitors aren't stuck waiting through WIDGET_TIMEOUT_MS.
      renderBoard(FALLBACK_BOARD, true);
    }
  });
})();

/*
 * Note: if a visitor's browser/ad-blocker blocks Pinterest's widget script
 * entirely, neither the seasonal nor the fallback board will render, since
 * both rely on the same script. There's no client-side-only way around that
 * without Pinterest API access (which requires OAuth/a backend).
 */
