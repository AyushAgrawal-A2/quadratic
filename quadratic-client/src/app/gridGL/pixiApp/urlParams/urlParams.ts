//! Loads and sets the URL params based on the current state of the app.
//!
//! There are two types of URL params: user-focused ones, and dev-focused one.
//! The dev-focused ones are triggered by `debugFlags.saveURLState = true;` and
//! save the entire state of the app. User-focused ones are limited to x, y,
//! sheet, and code editor only.

import { debugSaveURLState } from '@/app/debugFlags';
import { UrlParamsDev } from '@/app/gridGL/pixiApp/urlParams/UrlParamsDev';
import { UrlParamsUser } from '@/app/gridGL/pixiApp/urlParams/UrlParamsUser';

const UPDATE_INTERVAL = 100;

class UrlParams {
  private urlParamsDev?: UrlParamsDev;
  private urlParamsUser?: UrlParamsUser;

  init() {}

  show() {
    const params = new URLSearchParams(window.location.search);
    if (debugSaveURLState) {
      this.urlParamsDev = new UrlParamsDev(params);
    } else {
      this.urlParamsUser = new UrlParamsUser(params);
    }
    setInterval(this.update, UPDATE_INTERVAL);
  }

  update = () => {
    if (debugSaveURLState && this.urlParamsDev) {
      this.urlParamsDev.updateParams();
    } else if (!debugSaveURLState && this.urlParamsUser) {
      this.urlParamsUser.updateParams();
    }
  };
}

export const urlParams = new UrlParams();
