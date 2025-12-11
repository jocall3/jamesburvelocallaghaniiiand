export const googleIdpConfig = {
    entityID: 'https://accounts.google.com/o/saml2?idpid=C01esbeng',
    validUntil: '2028-10-12T01:07:54.000Z',
    wantAuthnRequestsSigned: false,
    protocolSupportEnumeration: 'urn:oasis:names:tc:SAML:2.0:protocol',
    signingCertificate: `MIIDdDCCAlygAwIBAgIGAYsrub5TMA0GCSqGSIb3DQEBCwUAMHsxFDASBgNVBAoTC0dvb2dsZSBJ
bmMuMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MQ8wDQYDVQQDEwZHb29nbGUxGDAWBgNVBAsTD0dv
b2dsZSBGb3IgV29yazELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEwHhcNMjMxMDE0
MDEwNzU0WhcNMjgxMDEyMDEwNzU0WjB7MRQwEgYDVQQKEwtHb29nbGUgSW5jLjEWMBQGA1UEBxMN
TW91bnRhaW4gVmlldzEPMA0GA1UEAxMGR29vZ2xlMRgwFgYDVQQLEw9Hb29nbGUgRm9yIFdvcmsx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAj8rGwJzIltPpk9OLYwTl8vx4c/i0mM/Oqn8cxcqxsOLZLjkVplZeGM6Hcs2pX18X
tBKJHlN8mlEJIwMdlU/qC12UWDAbddGfx7eAKY6w6J8rT93lHSYMdpXASQpyKqYWJUvNWqUZuMCB
rohI8eS4Qlr8djR2UH7yaIsiyshphwp5RjyKWfUwj9tHnVMN7G1OZyD8b/r979lrHgWCWqyKVImM
WGrxd7S2CPUueXspkGLJCGgRcpd+cVZzj6/qYJp8bIQetuZXictswtMQXEt5vRkeSc17RpzBSWbj
ogGkDFiXjB0i3NZCWG54P07+d65tZTTQKHBBXBGUmnRGeIW/VwIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQB4GqLO7Qdbl0Rb2t3syxGQQpk2unF9eUI4CseN2V9dRD1rD0mxaKd01TVJeqfY8k8HZK6v
v06OyN++nWpfxJ0W64u2OwNrnHjMnP/JSBFGuWEQvq+zC97HHdmpbmu3IhzhrIoG18aEJm2OIeLw
1KyPvyjBqKo1rNZqRFPn297OuI9hUpHnXgJcq6Imn0sE61VQowq17LsAnOLsfyxVF1wbYbASLl5g
bNXOqXErqbYadpkk5ZCUaHjyLqHWyW3a5XAdSc+lbJaqdi/fFsXpbhf2scLhHQhax/EI6MXde8Pu
h8kUFhcdJpPujLPaO0s9+Xbgl2hxCO97XDn0l2UnF3pp`.replace(/\s/g, ''),
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    singleSignOnService: {
        httpRedirect: 'https://accounts.google.com/o/saml2/idp?idpid=C01esbeng',
        httpPost: 'https://accounts.google.com/o/saml2/idp?idpid=C01esbeng'
    }
};