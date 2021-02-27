export function createConfirmationEmailHtml(
  tourName,
  tourDates,
  numConnections,
  modifyUrl,
  unsubscribeUrl,
  tourTimeUrl
) {
  return `
<p><h2>Congrats! Your Tour is Booked</h2></p>
<p>We are pleased to have you as our guest for a tour. We know you will have a great time, deepen your Bible knowledge, and make new acquaintances.</p>

<h3>Tour Details</h3>

<table style="border: none; border-spacing: 8px;">
<col width="130">
<tr>
  <td>Tour</td>
  <td style="padding-left:10px;">${tourName}</td>
</tr>
<tr>
  <td>Date & Time</td>
  <td style="padding-left:10px;"><span style="font-weight: bold;">${tourDates.fixedTime.combined}</span><br /><a href="${tourTimeUrl}">Click here</a> to view this in your local timezone</td>
</tr>
<tr>
  <td>Maximum Number of Connections</td>
  <td style="padding-left:10px;"><span style="font-size: 1.5em;">${numConnections}</span><br />
</td>
</tr>
</table>

<p>Zoom connection details will be sent to you <b>48 hours</b> before your tour starts. Please check our <a href="https://eden.tours/faq">frequently asked questions page</a> if you need more information.</p>

<h3>To cancel or modify</h3>
<p>To cancel or modify your reservation, please use this link:<br />
<a href="${modifyUrl}">${modifyUrl}</a></p>
<p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

export function createConfirmationEmailPlaintext(
  tourName,
  tourDates,
  numConnections,
  modifyUrl,
  unsubscribeUrl,
  tourTimeUrl
) {
  return `
Congrats! Your Tour is Booked
We are pleased to have you as our guest for a tour. We know you will have a great time, deepen your Bible knowledge, and make new acquaintances.

Your details are below:

  Tour: ${tourName}

  Date: ${tourDates.fixedTime.combined}
  You can view the tour date and time for your local timezone here: ${tourTimeUrl}
  
  Number of Connections: ${numConnections}

Zoom connection details will be sent to you 48 hours before your tour starts. Please check our frequently asked questions page (https://eden.tours/faq) if you need more information.

To cancel or modify your reservation, please use the following link:
${modifyUrl}


See you soon.
https://eden.tours




You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can unsubscribe using this link: ${unsubscribeUrl}.
  `
}

export function createTourStartEmailHtml(
  tourName,
  tourDates,
  numConnections,
  connectionInfo,
  unsubscribeUrl,
  tourTimeUrl
) {
  const formattedConnectionInfo =
    connectionInfo.indexOf('<br') != -1
      ? connectionInfo
      : connectionInfo.split('\n').join('<br />')

  return `
<p>Dear Friends,</p>

<p>Greetings from Turkey! We are looking forward to meeting you on your upcoming tour. Here are some reminders as well as your video conferencing connection instructions.</p>

<h3>Tour Details</h3>

<table style="border: none; border-spacing: 8px;">
<col width="130">
<tr>
  <td>Tour</td>
  <td style="padding-left:10px;">${tourName}</td>
</tr>
<tr>
  <td>Date & Time</td>
  <td style="padding-left:10px;"><span style="font-weight: bold;">${tourDates.fixedTime.combined}</span><br /><a href="${tourTimeUrl}">Click here</a> to view this in your local timezone</td>
</tr>
<tr>
  <td>Maximum Number of Connections</td>
  <td style="padding-left:10px;"><span style="font-size: 1.5em;">${numConnections}</span><br />
</td>
</tr>
</table>


<h3>Additional Notes</h3>
<ol>
<li>The Zoom conference will open 15 minutes before the scheduled time. Please connect at least 5 minutes before the scheduled time to make sure everything is working.</li>
<li>If you booked more than 1 connection, please forward this invitation to those in your group. </li>
<li>The tour will last about 2 ½ hours. We will take a short break in the middle and some time for Q&A at the end. The tour’s length may vary, so please allow for some extra time.</li>
<li>Have a look at our study map to prepare for the tour <a href="https://eden.tours/research">https://eden.tours/research</a>.</li>
<li>You may take personal notes. Video, audio recording, or live streaming are not permitted. No posting on social media.</li>
<li>The tour is absolutely FREE.</li>
<li>No formal dress is required.</li>
</ol>


<h3>Video Conference Connection Details</h3>
<div style="margin-right: 10px; padding: 15px; background-color: #deffff;">
  ${formattedConnectionInfo}
</div>
<br/><p>See you soon.<br />https://eden.tours</p>



<br /><br />
<p>You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
  `
}

export function createTourStartEmailPlaintext(
  tourName,
  tourDates,
  numConnections,
  connectionInfo,
  unsubscribeUrl,
  tourTimeUrl
) {
  return `
Dear Friends,

Greetings from Turkey! We are looking forward to meeting you on your upcoming tour. Here are your reservation details as well as your Zoom Meeting ID and password.

  Tour: ${tourName}

  Date: ${tourDates.fixedTime.combined}
  You can view the tour date and time for your local timezone here: ${tourTimeUrl}

  Maximum Number of Connections: ${numConnections}


Additional Notes

  - The Zoom conference will open 15 minutes before the scheduled time. Please connect at least 5 minutes before the scheduled time to make sure everything is working.
  - If you booked more than 1 connection, please forward this invitation to those in your group. 
  - The tour will last about 2 ½ hours. We will take a short break in the middle and some time for Q&A at the end. The tour’s length may vary, so please allow for some extra time.
  - Have a look at our study map to prepare for the tour <a href="https://eden.tours/research">https://eden.tours/research</a>.
  - You may take personal notes. Video, audio recording, or live streaming are not permitted. No posting on social media.
  - The tour is absolutely FREE
  - No formal dress is required.


Connection details

${connectionInfo
  .split('<br>')
  .map((s) => s.replace(/<\/?[^>]+(>|$)/g, ''))
  .map((s) => s.replace(/&nbsp;/g, ' '))
  .map((s) => `  ${s}`)
  .join('\n')}



See you soon.
https://eden.tours



You are receiving this message because you have submitted your email at https://eden.tours. If you believe this to be an error you can unsubscribe with this link: ${unsubscribeUrl}.
`
}
