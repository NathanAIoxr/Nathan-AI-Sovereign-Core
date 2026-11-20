export const foundation = {
  title: "Truth and True Love",
  label: "The motto, heart, soul, shadow, spirit, nothing and everything of Tabor Academy",
  author: "Nathan Tabor",
  path: "/tabor-academy/institution/foundation/",
  motto: "If you don’t know truth, you don’t know True love because love without truth is tough love …\n\nwhile love with truth is unconditional love",
  principles: [
    ["Motto", "Keep the exact words visible and return to them before deciding what to say or do."],
    ["Heart", "Protect innocence. Take a concern seriously, protect the person who raises it, and give them a way to get help."],
    ["Soul", "Take responsibility for your own words and actions. When a claim you made changes, make the correction where the original was heard."],
    ["Shadow", "Look at what got omitted, softened, or rewritten, including in your own account. Keep the original record beside the correction."],
    ["Spirit", "Keep care present when truth is hard to hear. A boundary can protect someone while leaving room for honesty and repair."],
    ["Nothing", "Leave a blank where the record gives you no answer. Say “I don’t know” and name what would help you find out."],
    ["Everything", "Apply the same questions to an institution, a friend, an AI, or yourself. Who said it? What supports it? What needs to be corrected?"],
  ],
  practice: [
    {
      title: "Check a contradiction",
      case: "A club organizer writes “Everyone was invited.” A message from the same organizer lists two members to leave off the invitation.",
      prompt: "Write one question that puts both statements on the record. What could still change your conclusion?",
      answer: "“Your announcement said everyone was invited, and this message names two people to leave off the list. Which instruction was used?” Check the invitations and whether the instruction was later reversed. The contradiction calls for an explanation and follow-through.",
    },
    {
      title: "Recognize a pattern",
      case: "A teammate points to a dated message three times. Each time, the group leader denies writing it, calls the teammate confused, and changes the subject.",
      prompt: "What behavior can you document? What can the teammate do if the conversation keeps repeating?",
      answer: "Record the denial, the dated message, and the repeated attacks on the teammate’s memory. Repeated denial and pressure to distrust one’s own recollection can be signs of gaslighting. The teammate can end the exchange and bring the record to a trusted person.",
    },
    {
      title: "Correct your own words",
      case: "You shared that a volunteer missed an event. A timestamped sign-in sheet shows the volunteer was there. Two people repeated your claim.",
      prompt: "Write the correction you would give the people who heard you. What repair can you follow through on?",
      answer: "“I said the volunteer missed the event. The sign-in sheet shows they attended. I was wrong.” Share that correction with the original audience, ask the people who repeated the claim to pass it along, and check that the public record reflects the correction.",
    },
    {
      title: "Protect a person and the record",
      case: "Someone tells you privately that a group member threatened them. You have their firsthand account, and the person is worried about retaliation.",
      prompt: "What care can you offer immediately? What belongs in the confidential record?",
      answer: "Ask what would help them feel safe and connect them with appropriate support. Preserve their account in their own words, with the date and any documents they choose to share. Limit access to the details and record what is known, what needs checking, and who is responsible for follow-up.",
    },
  ],
};

export function foundationQuote(data) {
  const paragraphs = data.motto.split("\n\n").map(line => "<p>" + line + "</p>").join("");
  return "<blockquote>" + paragraphs + "<footer>— " + data.author + "</footer></blockquote>";
}
