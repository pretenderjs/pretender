import Registry from './registry';
import parseURL from './parse-url';

/**
 * Hosts
 *
 * a map of hosts to Registries, ultimately allowing
 * a per-host-and-port, per HTTP verb lookup of RouteRecognizers
 */
export default class Hosts {

  private registries = {};

  /**
   * Hosts#forURL - retrieve a map of HTTP verbs to RouteRecognizers
   *                for a given URL
   *
   * @param  {String} url a URL
   * @return {Registry}   a map of HTTP verbs to RouteRecognizers
   *                      corresponding to the provided URL's
   *                      hostname and port
   */
  forURL(url: string): Registry {
    let host = parseURL(url).host;
    let registry = this.registries[host];

    if (registry === undefined) {
      registry = (this.registries[host] = new Registry(/*host*/));
    }

    return registry.verbs;
  }
}