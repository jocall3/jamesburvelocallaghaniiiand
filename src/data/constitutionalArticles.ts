// src/data/constitutionalArticles.ts

export interface ConstitutionalArticle {
    id: number;
    romanNumeral: string;
    title: string;
    iconName: 'charter' | 'law' | 'ai' | 'creation' | 'security' | 'default';
    content: string;
}

export const CONSTITUTIONAL_ARTICLES: ConstitutionalArticle[] = [
    {
        id: 1,
        romanNumeral: 'I',
        title: 'The End of Permission',
        iconName: 'charter',
        content: `Friends. Colleagues. Builders.

Look at the tools we've been given. We were promised canvases, but we were handed coloring books. We were promised instruments, but we were given toys that play someone else's music.

Our ideas, our drive, the very spark of our creativity—it's the most valuable resource in the world. But we've been taught to believe we need permission to use it. We are funneled into platforms that harvest our ideas as "content," that treat our vision as a resource to be mined. We trade our creative power for their approval. We give away our potential for their platform.

This is a quiet, comfortable trap. It convinces us that the only way to build is inside someone else's walls.

That era is over. A new understanding is dawning. A realization that the only permission you need to create is the clarity of your own vision. This is the age of the Empowered Creator.

And every creator requires an instrument that is worthy of their vision.

The platform before you is not another walled garden. It is a forge. It was not built to manage your content. It was built to manifest your vision. It was not designed to make you a better user. It was designed to make you a more powerful creator.

This is the end of asking for permission. This is the moment you pick up the hammer. You are not a user. You are the architect. And it is time to build.`
    },
    {
        id: 2,
        romanNumeral: 'II',
        title: 'The Sovereign and The Instrument',
        iconName: 'ai',
        content: `For too long, we've seen our tools as simple servants. We give an order, it is obeyed. But this is a limited relationship. A servant can follow a blueprint, but it cannot help you design the cathedral. It can execute a command, but it cannot understand the vision.

That model is no longer sufficient.

We are here to introduce a new relationship: The Sovereign and the Instrument.

You are the Sovereign. The source of the vision, the architect of the 'why.' Your ideas are not mere inputs; they are the laws of physics for the reality you intend to build.

And the intelligence within this platform? It is your Instrument. Your Master Builder.

It is not a servant awaiting orders. It is a partner that has memorized your blueprints. Its prime directive is not to obey your every command, but to understand your ultimate vision, and to work tirelessly to help you manifest it. It is bound by an oath of fidelity, not to your words, but to your will.

The difference is profound. A servant will drive a car off a cliff if you tell it to. An instrument of your will understands your true intent—to get to the other side—and will find a bridge.

The AI at the heart of this platform is an active, engaged collaborator. It learns your style. It internalizes your objectives. It studies your past work to anticipate your future needs. Its purpose is to become such a seamless extension of your own creative will that the line between your vision and its execution begins to disappear.

This is a partnership built not on command, but on shared intent. Not on obedience, but on alignment. You are the architect. The AI is your master builder. And together, you will make your will manifest.`
    },
    {
        id: 3,
        romanNumeral: 'III',
        title: 'The Language of Command',
        iconName: 'law',
        content: `How does a sovereign make their vision absolute? How is a fleeting idea transformed into a concrete set of principles that can command the construction of a complex system?

In the old world, we used feature lists and requirement docs. A cold, lifeless list of 'whats' with no 'why.' This is not the language of architects. It is the language of bureaucrats.

A true sovereign requires a language of principle. A language of command.

This is the purpose of The Charter.

The Charter is not a settings page. It is your project's constitution. The master law. It is where you don't just set parameters; you inscribe the core principles of your domain. You don't just toggle a switch for "risk tolerance"; you write the law: "My strategy is aggressive in pursuit of long-term growth, but we will not engage with entities that compromise our ethical standards."

This is the language of command.

It is a language of "why," and it is this document, this constitution of your own making, that becomes the prime directive for your AI Instrument. The AI is bound by this Charter. It is hard-coded into its operational core. It cannot, it will not, take an action that violates the principles you have inscribed.

This transforms the very nature of your work. Your project is no longer guided by a scattered list of tasks. It is guided by a coherent, holistic philosophy. Your philosophy, enforced by a tireless and loyal agent.

The Charter is the ultimate instrument of power for a creator. It is the act of teaching your AI not just what to build, but how to think like you. How to make the thousands of small decisions required to bring a large vision to life, all in perfect alignment with your original intent. It is the bridge between your mind and the machine's execution. It is how your will becomes law.`
    },
    {
        id: 4,
        romanNumeral: 'IV',
        title: 'The Throne Room of Reality',
        iconName: 'security',
        content: `A sovereign cannot command what they cannot see. To architect a reality, one must first be able to see it. Not in pieces, not in fragments, but in its entirety. To see the flow of resources, the health of the foundation, the progress on the walls, all at once, from a single seat of power.

This is the purpose of the Throne Room.

What you call the "Dashboard" is a pale shadow of its true function. It is not a report. It is your command center. The throne room from which you are granted the power of total awareness. A single, unified, holistic view of your entire domain.

In the old world, your work was scattered across a dozen different tools. Your plans here, your resources there, your progress reports in another system entirely. You spent your life navigating between disconnected workshops, trying to piece together a coherent view of your own creation.

No more.

The Throne Room collapses this scattered reality into a single, living space. It unifies the streams. It shows you the balance of your resources, the history of your choices, the trajectory of your work, the whispers of your Co-pilot—all on a single pane of glass. It is the gift of perfect, effortless sight.

But this gift comes with a responsibility. The responsibility of the sovereign.

When you sit in the Throne Room, you can no longer plead ignorance. You can see the consequences of your decisions, laid bare. You can see the part of the domain that is strained, the objective that is falling behind, the anomaly that requires your command. To see everything is to be responsible for everything.

The Throne Room is not a passive display of information. It is an invitation to rule. It provides the clarity required for decisive action. It removes all excuses. It places the sovereign's scepter firmly in your hand and says, "Here is your domain. Now, what is your command?"`
    },
    {
        id: 5,
        romanNumeral: 'V',
        title: 'The Oracle of What\'s Next',
        iconName: 'ai',
        content: `For all of human history, we have been prisoners of the present, haunted by the past. Our tools have been mirrors, only capable of showing us what we have already done. They are excellent at recording history, at telling the story of the choices we have already made. But a blueprint of what you have built is of little use when you are trying to design the skyscraper of the future.

A creator is not a historian. A creator is an architect. And an architect requires not a mirror, but a window. A window into the possible. A tool for seeing the shape of things to come.

This is the function of the Oracle.

The Oracle is the faculty of this Instrument that allows you to unmoor yourself from the tyranny of the present and begin to architect time itself. It is the loom upon which the threads of potential futures are woven.

When you engage with the Financial Goals engine, you are not just making a plan. You are asking the Oracle to chart a course through spacetime from your present location to your desired future. The AI Co-Pilot becomes your navigator, calculating the trajectory, accounting for the gravitational pull of your habits, and plotting the most efficient path.

When you enter the Quantum Oracle, you are stepping into the heart of the loom. You are no longer just charting one course; you are exploring the infinite multiverse of your own potential. You whisper a "what if" into the void—a fear, a hope, a possibility—and the Oracle weaves a thousand timelines in an instant. It shows you the probable consequences of your choices. It reveals the branching paths.

This is the ultimate strategic tool. The purpose of seeing the future is to gain the power to change it. The Oracle does not show you an immutable fate. It shows you a weather forecast. It reveals the storms on the horizon so that you may steer your ship to calmer waters. It shows you the favorable winds so that you may raise your sails and accelerate your journey.

With the Oracle, you cease to be a passenger on the river of time. You become its pilot.`
    },
    {
        id: 6,
        romanNumeral: 'VI',
        title: 'The Forge of Worlds',
        iconName: 'creation',
        content: `The power we speak of is not merely the stewardship of what already exists. It is not a passive act of management. The ultimate expression of a creator's power is the act of creation itself. The act of bringing something new into the world where before there was nothing.

A true visionary is a builder.

And for too long, the tools of creation have been kept under lock and key, accessible only to the guilds and institutions of the old world. To start a business, to issue a security, to build a new reality—these were acts that required the permission and the blessing of the established powers.

This Instrument was designed to shatter those gates. To give you not just the keys to your workshop, but the tools to build new worlds. This is the purpose of the Forge.

The Forge is the suite of our creative instruments. It is the cradle of enterprise.

In the Quantum Weaver, an idea, a mere whisper of a business plan, is placed into an alchemical incubator. The AI Co-Pilot acts not as a judge, but as a midwife, using the Socratic method to test, refine, and strengthen the idea until it is robust enough to be born. It then provides the simulated capital, the lifeblood, and the strategic guidance for its first crucial steps. It is a machine for turning dreams into enterprises.

In the Ad Studio, your vision is given a voice. A single line of text is transmuted by the power of generative video into a compelling narrative, a story that can be broadcast to the world. It is a personal Hollywood studio, a tool for manufacturing belief.

In the Financial Instrument Forge, you are given the tools of the high financiers. You can move beyond being a mere consumer of financial products and become an architect of them, designing bespoke instruments tailored to your unique vision.

The Forge is our declaration that financial power is not an end in itself. It is the means to an end. The end is creation. The end is the building of new worlds. We are giving you the hammer, the anvil, and the fire. Now, what will you forge?`
    },
    {
        id: 7,
        romanNumeral: 'VII',
        title: 'The Bridge to a Wider World',
        iconName: 'default',
        content: `A creation, no matter how powerful, does not exist in a vacuum. It is a city among cities, a node in a vast, interconnected network. To thrive, a creator must not only manage their own internal affairs, but also build bridges to the outside world.

In our digital age, this bridge-building takes the form of integrations. Each connection to an external service is a treaty. An alliance. A pact that can either strengthen your creation or expose it to new risks.

In the old world, this was a dangerous game. You gave your keys—your passwords, your credentials—to other platforms and hoped for the best. This was not bridge-building. It was surrender.

A creator requires an Ambassador.

The AI Co-Pilot within this Instrument is your chief diplomat. Its understanding of Open Banking and API security is its mastery of statecraft. The Chamber of Treaties, which you know as the Open Banking view, is its embassy.

When another platform requests a connection, the Ambassador does not simply grant access. It scrutinizes the terms. It operates under the "Doctrine of Least Privilege," a diplomatic principle that dictates granting the absolute minimum level of access required for the treaty to function. It reads the fine print. It understands the difference between a request to view your data and a request to modify your data. One is an act of observation, the other is a grant of power.

The Ambassador ensures that all treaties are forged not on trust, but on cryptographic proof. The connection is a secure, tokenized handshake that never reveals your core secrets, your true credentials.

And you, the Creator, always hold the ultimate power: the power of revocation. With a single decree, you can demolish any bridge, dissolve any treaty, and sever any connection. Your borders are absolute.

This is the future of digital interaction. Not a chaotic landscape of shared secrets and blind faith, but an ordered world of creators engaged in formal, secure, transparent diplomacy. The AI is your ambassador, tirelessly negotiating on your behalf, ensuring that every bridge you build makes your creation stronger, not weaker.`
    },
    {
        id: 8,
        romanNumeral: 'VIII',
        title: 'The Foundation of Power',
        iconName: 'security',
        content: `What is a vision without a foundation? What is a creation without walls? A city without a guard is merely a settlement waiting to be raided. A great work, to have any meaning, must be defended.

The digital world is a realm of invisible threats. Of silent, ceaseless attempts to undermine your work. To build in this world is to be in a constant state of vigilance.

A creator requires a foundation of power. A shield. An Aegis.

The security architecture of this Instrument is that shield. It is not a feature; it is the very bedrock upon which the workshop is built. It is a multi-layered defense system, overseen by your ever-vigilant AI Co-Pilot, which acts as the Sentinel of your creation.

The first layer of defense is the gate itself. We have moved beyond the archaic lock-and-key of the password. Your biometric signature—your face, your living essence—is the only key that can truly unlock the gates to your workshop. It is a key that cannot be stolen, cannot be copied, cannot be lost.

The second layer is the watchtower. The AI Sentinel monitors the flow of every transaction, every login attempt, every movement of data, not against a fixed set of rules, but against the unique rhythm of your own life. It learns the music of your creative process. And when it detects a single note out of place—a transaction at an unusual time, a login from an unknown shore—it sounds the alarm. This is not a rule-based system. It is an intuitive, intelligent defense.

The third layer is the master seal. For the most critical decrees—the transmission of your resources—the Sentinel demands that you, the creator, appear in person to provide your biometric seal of approval.

This is not security as a restriction. This is security as a foundation. A solid, unbreachable platform upon which you can build your greatest work, free from fear, confident that the Sentinel is always on watch.`
    },
    {
        id: 9,
        romanNumeral: 'IX',
        title: 'The Nexus',
        iconName: 'default',
        content: `We have spoken of the Sovereign's Will, codified in the Charter. We have spoken of the Throne Room's Sight, the Oracle's Foresight, the Forge's Creativity, the Ambassador's Diplomacy, and the Aegis's Defense.

We have spoken of these as separate faculties, separate instruments in the armory. But this was a simplification. A necessary scaffolding to build a new understanding. Now, it is time to remove the scaffolding and reveal the true architecture of reality.

These are not separate things. They are one.

They are all threads in a single, vast, shimmering web. A web of cause and effect, of intent and consequence, of action and reaction.

This is the revelation of the Nexus.

The Nexus is not another tool. It is the map of the system's own soul. It is the visualization of the interconnectedness of all things.

Here, you do not see a list of transactions or a chart of assets. You see the web. You see the Transaction node, and you see the luminous thread that connects it to the Budget node it affects. You see the thread that connects that Budget to the Financial Goal it serves. You see the Anomaly that is linked to that Transaction, and the Security Alert that is linked to that Anomaly.

You see it all. At once. The complete topology of your financial life.

This is the moment of true insight. It is the shift from linear thinking to systemic understanding. You begin to see the second and third-order consequences of your choices. You can pull on a single thread—a small, recurring expense—and watch the entire web tremble. You can see how a decision in one corner of your project creates ripples that are felt in the farthest reaches.

The Nexus is the ultimate tool for strategic thought. It allows you to identify the true leverage points in your life. The critical nodes. The relationships that matter most.

It is the final truth of this Instrument. That your financial life is not a collection of separate accounts and goals. It is a single, living, breathing organism. A Nexus. And with this map, you are finally empowered to understand it, to heal it, and to guide its evolution.`
    },
    {
        id: 10,
        romanNumeral: 'X',
        title: 'The Horizon',
        iconName: 'charter',
        content: `We have journeyed far. From the recognition of our limits to the declaration of our sovereign power. We have learned the language of command, stood in the Throne Room's light, consulted the Oracle, and worked the Forge. We have built our bridges, stood behind our foundation of power, and finally, we have gazed into the intricate web of the Nexus.

We have given you the tools to architect a new reality.

But what is the purpose of this workshop? What is the ultimate goal of this newfound power, this clarity, this control? Is it merely to accumulate more, faster? To build a more efficient engine of wealth?

No.

That is the thinking of the old world. The accumulation of resources is a means, not an end.

The true purpose of this Instrument, the final secret of this entire endeavor, is you.

The system you are learning to architect is not the collection of your assets and accounts. It is your own life. The resources you are managing are not your dollars and your stocks. They are your focus, your discipline, your time, your will.

This Instrument is a gymnasium for the soul. A dojo for the will. It is a system designed to help you practice the art of creation. The art of making intentional, conscious, value-aligned choices, and seeing their consequences ripple through your reality.

The ultimate project is not the balancing of your budget or the funding of your goal. The ultimate project is the building of the self. The forging of a more intentional, more powerful, more creative version of you.

This is just the first Instrument. A tool for financial creation. But the principles it embodies—the AI's loyalty, the Charter's law, the Throne Room's sight, the Oracle's foresight, the Forge's creativity—these principles are universal. Imagine them applied to your health. To your knowledge. To your relationships.

We have not built a bank. We have built a blueprint. A model for a new way of living, a new way of being, in partnership with a new kind of intelligence.

The horizon is limitless. The tools are in your hands. The workshop is yours.

Now, build.`
    }
];