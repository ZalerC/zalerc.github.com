function FindProxyForURL(url, host) {
    if (["www.dmm.com", "www.dmm.co.jp", "www.akabeesoft2.com", "www.akabeesoft3.com", "www.akatsukiworks.com", "www.alicesoft.com", "www.cosmiccute.com", "www.hibiki-site.com", "www.minori.ph", "erogamescape.ddo.jp", "tenco.cc", "wheel-soft.com"].indexOf(host) > -1) {
        url = url.split('/');
        if (url[0] == 'http:') return 'PROXY 106.186.27.62:80; PROXY www.crystalacg.com:80';
        if (url[0] == 'https:') return 'PROXY 106.186.27.62:443; PROXY super.crystalacg.com:8443'
    }
    if (["125.6.184.15", "125.6.184.16", "125.6.187.205", "125.6.187.229", "125.6.187.253", "125.6.188.25", "125.6.189.103", "125.6.189.135", "125.6.189.167", "125.6.189.215", "125.6.189.247", "125.6.189.39", "125.6.189.7", "125.6.189.71", "203.104.105.167", "203.104.209.23", "203.104.209.39", "203.104.209.55", "203.104.209.7", "203.104.209.71", "203.104.248.135", "222.158.206.145"].indexOf(host) > -1 ) {
        return 'PROXY super.crystalacg.com:80';
    }
    return 'DIRECT';
}
