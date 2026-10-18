import SwiftUI

private struct MammalQuestion {
    let prompt: String
    let answers: [String]
    let correct: Int
    let why: String
}

struct TrustQuizView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var questionIndex = 0
    @State private var selected: Int? = nil
    @State private var correctCount = 0

    private let questions: [MammalQuestion] = [
        .init(prompt: "A cat slowly blinks at you. What could you try?", answers: ["Stare without blinking", "Blink back gently", "Grab the cat"], correct: 1, why: "Soft, slow blinking can be a friendly cat signal. Let the cat choose whether to come closer."),
        .init(prompt: "Stewie walks away when his ear is touched. What should you do?", answers: ["Let him have space", "Chase him", "Pick him up anyway"], correct: 0, why: "Respect a cat's boundaries. Walking away is one way to say 'I'm done for now.'"),
        .init(prompt: "Ace freezes and shakes when his name is called. What is the kindest response?", answers: ["Assume he's always happy", "Watch his body and give him space", "Shout louder"], correct: 1, why: "A dog's freeze or shake might signal uncertainty or stress. Watch the whole dog and avoid pressure."),
        .init(prompt: "Champ thinks you have a snack. What is a safe idea?", answers: ["Tease him with food", "Offer only approved treats and keep calm", "Feed him anything he finds"], correct: 1, why: "People choose pet-safe foods and set consistent, gentle boundaries."),
        .init(prompt: "How do you build a mammal bond?", answers: ["Make promises you can't keep", "Demand obedience immediately", "Be kind, consistent, and listen"], correct: 2, why: "Your word is your bond. Reliability, patience, and respect help build trust.")
    ]

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 19) {
                    StoryHeading(title: "Speak Their Language", subtitle: "Words are only half of a mammal conversation.")
                    if questionIndex < questions.count {
                        GameArtwork("BondArt", ratio: 1.65, label: "The mammal family together")
                    HStack { StarCount(); Spacer(); Text("Question \(questionIndex + 1) / \(questions.count)").font(.subheadline.bold()) }
                        GameCard {
                            Text("🐾  THE MAMMAL BOND")
                                .font(.system(.caption, design: .rounded, weight: .black))
                                .foregroundStyle(.teal)
                            Text(questions[questionIndex].prompt)
                                .font(.system(.title3, design: .rounded, weight: .bold))
                                .multilineTextAlignment(.center)
                                .padding(.vertical, 10)
                            ForEach(questions[questionIndex].answers.indices, id: \.self) { index in
                                Button { answer(index) } label: {
                                    HStack {
                                        Text(questions[questionIndex].answers[index])
                                            .multilineTextAlignment(.leading)
                                        Spacer()
                                        if selected == index { Image(systemName: "checkmark.circle.fill") }
                                    }
                                    .font(.system(.body, design: .rounded, weight: .semibold))
                                    .padding(14)
                                    .frame(maxWidth: .infinity)
                                    .background(selected == index ? Color.mint.opacity(0.38) : Color.gray.opacity(0.10), in: RoundedRectangle(cornerRadius: 13))
                                }
                                .buttonStyle(.plain)
                                .disabled(selected != nil)
                            }
                        }
                        if selected != nil {
                            GameCard {
                                Text(selected == questions[questionIndex].correct ? "Lovely listening! ❤️" : "Every mammal is still learning! 💛")
                                    .font(.headline)
                                Text(questions[questionIndex].why)
                                    .multilineTextAlignment(.center)
                                PawButton(title: "Next", symbol: "arrow.right") {
                                    questionIndex += 1
                                    selected = nil
                                    if questionIndex == questions.count { progress.win("kindness", reward: 30) }
                                }
                            }
                        }
                    } else {
                        GameCard {
                            Text("🏆").font(.system(size: 80))
                            Text("MAMMAL FRIEND!").font(.system(.title2, design: .rounded, weight: .black))
                            Text("You listened carefully: \(correctCount) of \(questions.count) answers correct.")
                                .multilineTextAlignment(.center)
                            AwardBanner(title: "The Mammal Bond! +30 stars")
                            PawButton(title: "Learn again", symbol: "arrow.clockwise") { reset() }
                        }
                    }
                    Text("For children: always ask a trusted adult before approaching or feeding an unfamiliar animal.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(12)
                }
                .padding(18)
            }
        }
        .navigationTitle("Mammal Language")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func answer(_ value: Int) {
        guard selected == nil else { return }
        selected = value
        if value == questions[questionIndex].correct { correctCount += 1 }
    }
    private func reset() {
        selected = nil
        questionIndex = 0
        correctCount = 0
    }
}