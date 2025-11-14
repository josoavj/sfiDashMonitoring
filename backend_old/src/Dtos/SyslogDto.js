export default class SyslogDto {
    ipSource = '';
    portSource = 0;
    bytesSource = 0;
    bytesNetwork = 0;
    ruleName = '';
    ipDestination = '';
    portDestination = 0;
    addressDestination = '';
    bytesDestination = 0;
    destinationOrgName = '';
    fortinetFirewallDestinetsvc = '';
    fortinetFirewallvwlqualitySeqNum = 0;
    fortinetFirewallvwlqualitySeqPort = 0;
    relatedIps = {};
  
    showDetails() {
      for (const key in this) {
        if (key !== 'relatedIps' && this[key] !== undefined) {
          console.log(`${key} : ${this[key]}`);
        }
      }
    }
  }
  