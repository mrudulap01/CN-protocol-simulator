// All data here is predefined and SIMULATED. Nothing touches a real network.
// A step moves a message along `path` (list of device ids), then logs `log`
// and merges `set` into the live "result" panel. `drop` = message is lost.
// `end` marks the final step ('ok' or 'fail').
const N = (id, icon, name, x, y) => ({ id, icon, name, x, y })
const st = (path, label, log, more = {}) => ({ path, label, log, ...more })
const opt = (key, label, choices) => ({ key, label, choices })

export const SCENARIOS = [
  {
    id: 'dhcp', tab: 'DHCP', title: 'Student Connects to College Wi-Fi',
    story: `A student's laptop joins the college Wi-Fi. It has no IP address yet, so it asks the network for one.`,
    why: 'Without DHCP, every device would need its address typed in by hand. DHCP hands out addresses automatically and avoids two devices using the same one.',
    nodes: [N('pc', '💻', 'Student laptop', 70, 130), N('ap', '📶', 'Wi-Fi access point', 300, 130), N('srv', '🗄️', 'DHCP server', 530, 130)],
    links: [['pc', 'ap'], ['ap', 'srv']], opts: [],
    build: () => ({ steps: [
      st(['pc', 'ap', 'srv'], 'DHCP Discover', 'The laptop has no address, so it shouts to everyone: "Is there a DHCP server? I need an IP address!"', { set: { Status: 'Looking for a DHCP server' } }),
      st(['srv', 'ap', 'pc'], 'DHCP Offer', 'The DHCP server replies: "You can use 192.168.10.57 if you want it."', { set: { Status: 'Offer received', 'Offered IP': '192.168.10.57' } }),
      st(['pc', 'ap', 'srv'], 'DHCP Request', 'The laptop answers: "Yes please, I would like 192.168.10.57."', { set: { Status: 'Requesting the offered address' } }),
      st(['srv', 'ap', 'pc'], 'DHCP Acknowledge', 'The server confirms and sends the full settings. The laptop is now online!', { end: 'ok', set: { Status: 'Connected', 'IP address': '192.168.10.57', 'Subnet mask': '255.255.255.0', Gateway: '192.168.10.1', 'Lease time': '8 hours' } }),
    ] }),
  },
  {
    id: 'dns', tab: 'DNS', title: 'Student Opens a College Website',
    story: 'A student types portal.college.local into the browser. Computers talk using numbers, so the name must be translated into an IP address first.',
    why: 'DNS works like a phone book for the network: people remember names, computers need numbers. DNS translates one into the other.',
    nodes: [N('pc', '💻', 'Student browser', 60, 130), N('sw', '🔀', 'Switch', 230, 130), N('dns', '📖', 'DNS server', 420, 50), N('web', '🌐', 'Portal web server', 420, 210)],
    links: [['pc', 'sw'], ['sw', 'dns'], ['sw', 'web']],
    opts: [opt('case', 'Lookup type', [['normal', 'Normal lookup'], ['cached', 'Cached lookup'], ['unknown', 'Unknown domain']])],
    build: (o) => {
      const dom = o.case === 'unknown' ? 'portal.colege.local' : 'portal.college.local', ip = '10.0.5.20', s = []
      if (o.case === 'cached') {
        s.push(st(['pc'], 'Check DNS cache', `The browser checks its memory first. It already knows ${dom} = ${ip} from an earlier visit, so no DNS query is needed.`, { set: { Domain: dom, Cache: 'Hit (fast!)', 'IP address': ip } }))
      } else {
        s.push(st(['pc'], 'Check DNS cache', `The browser looks for ${dom} in its cache. Nothing found, so it must ask the DNS server.`, { set: { Domain: dom, Cache: 'Miss' } }))
        s.push(st(['pc', 'sw', 'dns'], 'DNS Query', `The laptop asks the DNS server: "What is the IP address of ${dom}?"`))
        if (o.case === 'unknown') {
          s.push(st(['dns', 'sw', 'pc'], 'DNS Reply: NXDOMAIN', `The DNS server has no record for ${dom} and answers "this name does not exist". The page cannot open. (Check the spelling!)`, { end: 'fail', set: { 'IP address': 'none (NXDOMAIN)', Status: 'Name not found' } }))
          return { steps: s }
        }
        s.push(st(['dns', 'sw', 'pc'], 'DNS Reply', `The DNS server answers: ${dom} is ${ip}. The laptop saves this in its cache.`, { set: { 'IP address': ip } }))
      }
      s.push(st(['pc', 'sw', 'web'], 'Connect to web server', `Now the browser knows the number, so it connects to ${ip} and asks for the portal page (simulated).`, { end: 'ok', set: { Status: 'Portal page loading' } }))
      return { steps: s }
    },
  },
  {
    id: 'ping', tab: 'Ping / ICMP', title: 'College Portal Is Not Opening',
    story: 'A student wants to know if the college server is reachable. Ping sends 4 small test messages (Echo Requests) and waits for Echo Replies. Try disconnecting the link!',
    why: 'Ping is the quickest health check on a network: it shows whether a device is reachable, how fast it answers, and how many messages are lost.',
    nodes: [N('pc', '💻', 'Student laptop', 70, 130), N('sw', '🔀', 'Switch', 300, 130), N('srv', '🖥️', 'College server', 530, 130)],
    links: [['pc', 'sw'], ['sw', 'srv']],
    opts: [opt('link', 'Switch ↔ Server link', [['up', 'Connected'], ['down', 'Disconnected']])],
    build: (o) => {
      const down = o.link === 'down', times = [12, 9, 14, 11], s = []
      let rx = 0
      for (let i = 0; i < 4; i++) {
        const n = i + 1, last = n === 4
        if (down) {
          s.push(st(['pc', 'sw', 'srv'], `Echo Request #${n}`, `Request ${n} is sent but the link is broken, so it never arrives. Result: Request timed out.`, { drop: true, end: last ? 'fail' : undefined, set: { Sent: n, Received: 0, 'Packet loss': '100 %', 'Response time': 'timed out' } }))
        } else {
          s.push(st(['pc', 'sw', 'srv'], `Echo Request #${n}`, `The laptop sends Echo Request ${n}: "Are you there?"`, { set: { Sent: n } }))
          rx++
          s.push(st(['srv', 'sw', 'pc'], `Echo Reply #${n}`, `The server replies: "Yes, I am here." Round trip: ${times[i]} ms (simulated).`, { end: last ? 'ok' : undefined, set: { Received: rx, 'Packet loss': `${Math.round(((n - rx) / n) * 100)} %`, 'Response time': `${times[i]} ms` } }))
        }
      }
      return { steps: s, down: [['sw', 'srv']] }
    },
  },
  {
    id: 'snmp', tab: 'SNMP', title: 'Administrator Checks a Router',
    story: 'Before an online exam, the network administrator uses SNMP to ask a router for its name, uptime and CPU usage. The router runs a small SNMP "agent" that answers.',
    why: 'SNMP lets administrators monitor many devices from one place, so problems (like an overloaded router) are found before they hurt users.',
    nodes: [N('mgr', '🧑‍💻', 'SNMP manager', 70, 130), N('sw', '🔀', 'Switch', 300, 130), N('rt', '📡', 'Router (SNMP agent)', 530, 130)],
    links: [['mgr', 'sw'], ['sw', 'rt']],
    opts: [opt('dev', 'Router state', [['on', 'Online'], ['off', 'Offline']])],
    build: (o) => {
      if (o.dev === 'off') return { off: ['rt'], steps: [
        st(['mgr', 'sw', 'rt'], 'GET sysName', 'The manager asks the router for its system name, but the router is offline, so nothing comes back.', { drop: true, set: { Status: 'No response, retrying' } }),
        st(['mgr', 'sw', 'rt'], 'GET sysName (retry)', 'The manager tries once more. Still no answer, so it reports a timeout. The admin should check the router before the exam!', { drop: true, end: 'fail', set: { Status: 'Timeout: router unreachable' } }),
      ] }
      const q = [['sysName', 'System name', 'CORE-RTR-01'], ['sysUpTime', 'Uptime', '42 days 06:15'], ['cpuUsage', 'CPU usage', '23 %']]
      return { steps: q.flatMap(([oid, name, val], i) => [
        st(['mgr', 'sw', 'rt'], `GET ${oid}`, `The manager asks the router agent: "What is your ${name.toLowerCase()}?"`),
        st(['rt', 'sw', 'mgr'], `Response: ${val}`, `The agent answers: ${name} = ${val}.`, { end: i === 2 ? 'ok' : undefined, set: { [name]: val } }),
      ]) }
    },
  },
  {
    id: 'smtp', tab: 'SMTP', title: 'Student Sends an Assignment by Email',
    story: 'A student emails assignment.pdf to a professor. Email hops from the sender to an outgoing mail server, then to the recipient’s mail server. (Simulated: no real email is sent.)',
    why: 'SMTP is the standard way mail servers hand email to each other, so a message from any provider can reach any other mailbox.',
    nodes: [N('pc', '💻', 'Student computer', 60, 150), N('out', '📤', 'Outgoing mail server', 215, 150), N('dns', '📖', 'DNS server', 215, 45), N('in', '📥', 'Recipient mail server', 390, 150), N('prof', '👩‍🏫', 'Professor mailbox', 540, 150)],
    links: [['pc', 'out'], ['out', 'dns'], ['out', 'in'], ['in', 'prof']],
    opts: [opt('to', 'Recipient address', [['ok', 'prof.rao@college.local (valid)'], ['bad', 'prof.roa@college.local (typo)']])],
    build: (o) => {
      const bad = o.to === 'bad', s = [
        st(['pc', 'out'], 'Send email', 'The student presses Send. The mail app gives the email (with assignment.pdf) to the outgoing mail server.', { set: { Status: 'Handed to outgoing server' } }),
        st(['out', 'dns'], 'DNS: find mail server', 'The outgoing server asks DNS: "Which server receives mail for college.local?"'),
        st(['dns', 'out'], 'DNS reply', 'DNS answers: mail.college.local at 10.0.8.25.', { set: { 'Mail server': 'mail.college.local (10.0.8.25)' } }),
        st(['out', 'in'], 'SMTP: HELO, MAIL FROM, RCPT TO', 'The servers greet each other, then the sender says who the mail is from and who it is for.'),
      ]
      if (bad) return { steps: [...s,
        st(['in', 'out'], 'SMTP 550: no such user', 'The recipient server says: "550, that mailbox does not exist."', { drop: false, set: { Status: 'Rejected by recipient server' } }),
        st(['out', 'pc'], 'Bounce message', 'The outgoing server sends a failure notice back to the student. Delivery FAILED. Check the address!', { end: 'fail', set: { Status: 'Failed' } }),
      ] }
      return { steps: [...s,
        st(['in', 'out'], 'SMTP 250 OK', 'The recipient server replies "250 OK": it accepts this recipient.'),
        st(['out', 'in'], 'SMTP: DATA', 'The outgoing server transfers the email body and the attachment.', { set: { Status: 'Transferring message' } }),
        st(['in', 'out'], 'SMTP 250 Queued', 'The recipient server confirms it has accepted the message.'),
        st(['in', 'prof'], 'Deliver to mailbox', 'The message is stored in the professor’s mailbox. Delivered!', { end: 'ok', set: { Status: 'Delivered' } }),
      ] }
    },
  },
]
