import {
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory } from
"@skyway-sdk/room";

const serverUrl = "http://localhost:3000";

void (async () => {
  const localVideo = document.getElementById("local-video");
  const remoteVideo = document.getElementById(
    "remote-video"
  );
  const remoteAudio = document.getElementById(
    "remote-audio"
  );
  const joinButton = document.getElementById("join");

  const { audio, video } =
  await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  joinButton.onclick = async () => {
    const currentUrl = new URL(window.location.href);

    const sessionId = currentUrl.searchParams.get("sessionId");
    if (sessionId === "") return;

    const response = await (
    await fetch(`${serverUrl}/join/session/${sessionId}`)).
    json();
    if (response.error) {
      return;
    }
    const { roomName, memberName, token } = response;
    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: "p2p",
      name: roomName
    });
    const me = await room.join({ name: memberName });

    await me.publish(audio);
    await me.publish(video);

    const subscribeAndAttach = async (publication) => {
      if (publication.publisher.id === me.id) return;

      const { stream } = await me.subscribe(publication.id);

      switch (stream.contentType) {
        case "video":
          {
            remoteVideo.playsInline = true;
            remoteVideo.autoplay = true;
            stream.attach(remoteVideo);
          }
          break;
        case "audio":
          {
            remoteAudio.controls = true;
            remoteAudio.autoplay = true;
            stream.attach(remoteAudio);
          }
          break;
      }
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();
