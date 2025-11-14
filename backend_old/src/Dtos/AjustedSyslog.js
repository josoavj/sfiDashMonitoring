export default class AjustedSyslog {
    constructor(object) {
      const src = object._source;
  
      this.source = src.source;
      this.destination = src.destination;
      this.network = src.network;
  
      if (src.fortinet !== undefined) {
        this.fortinet = src.fortinet.firewall;
      }
  
      if (src.rule !== undefined) {
        this.rules = src.rule;
      }
  
      this.related = src.related;
  }
}