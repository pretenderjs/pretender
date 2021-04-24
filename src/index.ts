import parseURL from './parse-url';
import Registry from './registry';
import Hosts from './hosts';
import Pretender from './pretender';

Pretender.parseURL = parseURL;
Pretender.Hosts = Hosts;
Pretender.Registry = Registry;
export default Pretender;
