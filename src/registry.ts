import RouteRecognizer from 'route-recognizer';

/**
 * Registry
 *
 * A registry is a map of HTTP verbs to route recognizers.
 */
export default class Registry {

  public verbs;

  constructor(/* host */) {
    // Herein we keep track of RouteRecognizer instances
    // keyed by HTTP method. Feel free to add more as needed.
    this.verbs = {
      GET: new RouteRecognizer(),
      PUT: new RouteRecognizer(),
      POST: new RouteRecognizer(),
      DELETE: new RouteRecognizer(),
      PATCH: new RouteRecognizer(),
      HEAD: new RouteRecognizer(),
      OPTIONS: new RouteRecognizer()
    };
  }
}

