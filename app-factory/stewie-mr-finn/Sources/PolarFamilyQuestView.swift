import SwiftUI

// Native North Paw ↔ South Paw campaign, separate from the original 48 boards.
// Original SwiftUI geometry and emoji; no downloaded characters or media.

struct PolarFamilyQuestView: View {
    @EnvironmentObject private var progress: MammalProgress
    @AppStorage("mammal.polar.quest.v1") private var savedProgress = ""
    @State private var family = PolarFamilySave()
    @State private var showFamily = false

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 16) {
                    StoryHeading(title: "THE POLAR FAMILY",
                                 subtitle: "HO HO HO meets OH OH OH · Two worlds, one magical friendship bridge")
                    PolarAuroraCard(region: .north, isWide: true)

                    GameCard {
                        HStack {
                            Label("Polar Adventure Progress", systemImage: "star.circle.fill")
                                .font(.system(.headline, design: .rounded, weight: .bold))
                            Spacer(minLength: 8)
                            Text("\(family.completed) / 16").font(.headline.monospacedDigit())
                        }
                        ProgressView(value: Double(family.completed), total: 16)
                            .tint(.teal)
                            .accessibilityLabel("\(family.completed) of 16 polar chapters completed")
                        HStack {
                            Label("\(family.stars) stars", systemImage: "star.fill")
                                .foregroundStyle(.orange)
                            Spacer()
                            if family.reunionComplete {
                                Label("Reunion unlocked!", systemImage: "checkmark.seal.fill")
                                    .foregroundStyle(.green)
                            } else {
                                Text("Finish chapters to unlock the reunion")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .font(.caption.bold())
                    }
                    GameCard {
                        Text("YOUR THREE CONSCIOUSNESSES")
                            .font(.system(.caption, design: .rounded, weight: .black))
                        HStack(spacing: 8) {
                            phaseTag("↑", title: "ABOVE C", subtitle: "What was said?", color: .orange)
                            phaseTag("●", title: "MIDDLE C", subtitle: "What is true?", color: .purple)
                            phaseTag("↓", title: "BELOW C", subtitle: "What do you see?", color: .teal)
                        }
                        Text("Listen, flip letters, compare numbers, notice nature, and respect every animal's NO.")
                            .font(.footnote).multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    group(for: .north)
                    group(for: .south)

                    GameCard {
                        Text("KEEP EXPLORING THE MIDDLE C").font(.headline)
                        Text("Take the lessons from the story into original word, sound, mirror, and balanced-motor games.")
                            .font(.footnote).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        NavigationLink(destination: PolarMiddleCView()) {
                            Label("Play the Polar Word Detective", systemImage:"textformat.abc")
                                .frame(maxWidth:.infinity).padding(14)
                                .background(Color.mint.opacity(0.18), in:RoundedRectangle(cornerRadius:15))
                        }
                        NavigationLink(destination: PawMirrorBridgeView()) {
                            Label("Play the PAWS ⇄ SWAP Mirror Bridge", systemImage:"arrow.left.arrow.right")
                                .frame(maxWidth:.infinity).padding(14)
                                .background(Color.indigo.opacity(0.11), in:RoundedRectangle(cornerRadius:15))
                        }
                    }

                    group(for: .south)

                    GameCard {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) { showFamily.toggle() }
                        } label: {
                            HStack {
                                Image(systemName: "person.3.sequence.fill")
                                Text("Meet the whole polar family").font(.headline)
                                Spacer()
                                Image(systemName: showFamily ? "chevron.up" : "chevron.down")
                            }
                        }
                        .buttonStyle(.plain)
                        if showFamily {
                            ForEach(PolarCast.members) { member in
                                HStack(alignment: .top, spacing: 12) {
                                    Text(member.icon).font(.system(size: 29)).frame(width: 38)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(member.name).font(.headline)
                                        Text(member.story).font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(.vertical, 5)
                                .accessibilityElement(children: .combine)
                            }
                        }
                    }

                    GameCard {
                        Text("REAL ANIMALS • MAGICAL STORY")
                            .font(.caption.bold())
                        Text("Wild penguins naturally live in the Southern Hemisphere; the story's travel between poles happens through an imaginary portal. Always give real animals space, ask a responsible adult, and observe wildlife safely.")
                            .font(.footnote).multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    Text("Original characters and game by Nathan Tabor · Saved privately on this device · No ads or in-app purchases")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(17)
            }
        }
        .navigationTitle("Polar Family")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { family = PolarFamilySave.restored(savedProgress) }
    }

    private func phaseTag(_ icon: String, title: String, subtitle: String, color: Color) -> some View {
        VStack(spacing: 5) {
            Text(icon).font(.title2.bold())
            Text(title).font(.system(size: 10, weight: .black, design: .rounded))
                .minimumScaleFactor(0.7).lineLimit(1)
            Text(subtitle).font(.system(size: 9, weight: .medium, design: .rounded))
                .multilineTextAlignment(.center).lineLimit(2)
        }
        .frame(maxWidth: .infinity).frame(minHeight: 91)
        .padding(.horizontal, 2)
        .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 13))
    }

    private func group(for region: PolarRegion) -> some View {
        VStack(spacing: 11) {
            HStack {
                Text(region.symbol).font(.system(size: 29))
                VStack(alignment: .leading, spacing: 2) {
                    Text(region.title).font(.system(.title2, design: .rounded, weight: .black))
                    Text(region.greeting).font(.caption.bold())
                }
                Spacer()
                Text(region == .north ? "CHAPTERS 1–8" : "CHAPTERS 9–16")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 5)
            ForEach(PolarFamilyCatalog.chapters.filter { $0.region == region }) { chapter in
                let unlocked = family.isUnlocked(chapter.id)
                NavigationLink {
                    PolarChapterPlayView(chapter: chapter) { id, correct in
                        record(chapter: id, correct: correct)
                    }
                } label: {
                    HStack(spacing: 13) {
                        Text(chapter.icon).font(.system(size: 32))
                            .frame(width: 54, height: 56)
                            .background(region == .north ? Color.orange.opacity(0.16) : Color.cyan.opacity(0.17),
                                        in: RoundedRectangle(cornerRadius: 16))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(chapter.id). \(chapter.title)")
                                .font(.system(.subheadline, design: .rounded, weight: .heavy))
                                .foregroundStyle(.primary)
                                .multilineTextAlignment(.leading)
                            Text(chapter.guide).font(.caption)
                                .foregroundStyle(.secondary)
                            if let stars = family.ratings[chapter.id] {
                                Text(String(repeating: "★", count: stars) + String(repeating: "☆", count: 3 - stars))
                                    .foregroundStyle(.orange).font(.caption.bold())
                            }
                        }
                        Spacer(minLength: 4)
                        Image(systemName: unlocked ? "chevron.right" : "lock.fill")
                            .foregroundStyle(unlocked ? .teal : .gray)
                    }
                    .padding(12)
                    .background(.white.opacity(unlocked ? 0.96 : 0.55),
                                in: RoundedRectangle(cornerRadius: 20))
                }
                .buttonStyle(.plain)
                .disabled(!unlocked)
                .accessibilityLabel(chapter.title + (unlocked ? ", play chapter" : ", locked until the previous chapter is complete"))
            }
        }
    }

    private func record(chapter: Int, correct: Int) {
        guard family.isUnlocked(chapter) else { return }
        family.complete(chapter: chapter, correct: correct)
        savedProgress = family.serialized()
        if family.reunionComplete { progress.win("polar-reunion.v1", reward: 30) }
    }
}

private struct PolarAuroraCard: View {
    let region: PolarRegion
    var isWide = false
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 27)
                .fill(LinearGradient(
                    colors: [.init(red: 0.07, green: 0.29, blue: 0.40),
                             .init(red: 0.18, green: 0.47, blue: 0.41),
                             .init(red: 0.23, green: 0.20, blue: 0.53)],
                    startPoint: .topLeading, endPoint: .bottomTrailing))
            Circle().fill(Color.mint.opacity(0.45))
                .frame(width: 150,height: 150)
                .blur(radius: 47).offset(x: -75, y: -50)
            Circle().fill(Color.pink.opacity(0.25))
                .frame(width: 180,height: 150)
                .blur(radius: 49).offset(x: 110, y: -40)
            VStack(spacing: 11) {
                HStack(spacing: 13) {
                    Text("🎅🐕").font(.system(size: 43))
                    Image(systemName: "arrow.left.arrow.right")
                        .font(.title3.bold())
                        .foregroundStyle(.yellow)
                    Text("🐈‍⬛ 🐈").font(.system(size: 41))
                    Image(systemName: "arrow.left.arrow.right")
                        .font(.title3.bold())
                        .foregroundStyle(.yellow)
                    Text("🐧❄️").font(.system(size: 42))
                }.minimumScaleFactor(0.75)
                Text("NORTH PAW  ↔  SOUTH PAW")
                    .font(.system(.headline, design: .rounded, weight: .black))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.7).lineLimit(1)
                Text("Two poles • One family • A bridge built from kindness")
                    .font(.caption).foregroundStyle(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
            }
            .padding(18)
        }
        .frame(height: isWide ? 170 : 145)
        .accessibilityElement(children: .combine)
    }
}

private struct PolarCast: Identifiable {
    let id: String
    let icon: String
    let story: String
    var name: String { id }
    static let members: [PolarCast] = [
        .init(id:"Stewart (Stewie)",icon:"🐈",story:"The cat whose white fur divides his black patches, a puzzle-maker with gentle paws."),
        .init(id:"Mr. Finn",icon:"🐈‍⬛",story:"Stewie's puzzle-piece counterpart; together the cats bridge two complementary patterns."),
        .init(id:"Champ",icon:"🐕",story:"The tan, long-legged hound whose snack detective skills help the visitors."),
        .init(id:"Ace",icon:"🐶",story:"The long-haired reddish Australian Shepherd who teaches playful listening."),
        .init(id:"HO HO HO Santa Dog",icon:"🎅🐕",story:"The friendly North Paw leader whose story greeting is SUP? with his head nod up."),
        .init(id:"Holly Howl",icon:"🐕",story:"North Paw's watchful German Shepherd and expert in respect and boundaries."),
        .init(id:"Mistletoe Mae",icon:"💝",story:"A kind golden retriever who welcomes shy newcomers at their own pace."),
        .init(id:"Cocoa Cuddles",icon:"🧸",story:"A Newfoundland and the warm-lodge caretaker."),
        .init(id:"Peppermint Dot",icon:"🎁",story:"A Dalmatian inventor who makes the workshop's imaginative toys."),
        .init(id:"Tinsel Toots",icon:"🐕",story:"A cheerful corgi and North Paw snow-tunnel comedian."),
        .init(id:"Blizzard Belle",icon:"🌌",story:"A husky guide who knows the northern lights."),
        .init(id:"Jingle Jack",icon:"🍪",story:"The curious beagle and biscuit detective."),
        .init(id:"Juniper Jingles",icon:"🚂",story:"The Border Collie who keeps the Friendship Express welcoming."),
        .init(id:"Auntie Nutmeg",icon:"📜",story:"A thoughtful older basset hound who remembers everybody's story."),
        .init(id:"Coal Comet",icon:"🛷",story:"A gentle black German Shepherd who supports North Paw's winter rescue team."),
        .init(id:"Pip & Poppy",icon:"🐾",story:"The playful pups who love mirrored paths and sharing."),
        .init(id:"OH OH OH Ozzie",icon:"🐧",story:"The South Paw emperor penguin who greets discoveries with OH!"),
        .init(id:"Oona Aurora",icon:"✨",story:"The penguin guide to South Paw's beautiful southern lights."),
        .init(id:"Grandma Orla",icon:"📖",story:"The elder penguin who protects South Paw's family history and ice maps."),
        .init(id:"Opal Flip",icon:"🪞",story:"The Adélie penguin who builds reflection puzzles."),
        .init(id:"Otto Orbit",icon:"⭐",story:"The star-watching penguin with a telescope and patient questions."),
        .init(id:"Olive Current",icon:"🐋",story:"The story's wise orca ocean guide."),
        .init(id:"Ollie Echo",icon:"🎵",story:"A Weddell Seal fascinated by reflected sounds."),
        .init(id:"Oceana Blue",icon:"🌊",story:"A leopard seal guardian learning that friendships start with respecting space."),
        .init(id:"Oracle Aurora",icon:"🪽",story:"The snow petrel messenger who observes changes in polar weather."),
        .init(id:"Oscar Skua",icon:"🪶",story:"A curious Antarctic skua and collector of shiny puzzle clues."),
        .init(id:"Odie & Oda",icon:"🧣",story:"Twin penguin chicks who show how opposite patterns can fit together.")
    ]
}

struct PolarChapterPlayView: View {
    let chapter: PolarChapter
    let onComplete: (Int, Int) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var questionIndex = 0
    @State private var selected: Int? = nil
    @State private var numberCorrect = 0
    @State private var isComplete = false

    private var question: PolarQuiz { chapter.puzzles[min(questionIndex, chapter.puzzles.count-1)] }

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 17) {
                    StoryHeading(title: chapter.title,
                                 subtitle: chapter.region.title + " · with " + chapter.guide)
                    Text(chapter.icon).font(.system(size: 72))
                        .frame(maxWidth:.infinity).padding(22)
                        .background(chapter.region == .north ? Color.orange.opacity(0.17) : Color.cyan.opacity(0.18),
                                    in: RoundedRectangle(cornerRadius: 23))
                        .accessibilityHidden(true)
                    GameCard {
                        Text(chapter.story)
                            .font(.subheadline)
                            .multilineTextAlignment(.center)
                        if isComplete {
                            Label("BRIDGE COMPLETE!", systemImage:"checkmark.seal.fill")
                                .font(.title2.bold()).foregroundStyle(.teal)
                            Text("You answered \(numberCorrect) of 3 clues on your first try.")
                                .multilineTextAlignment(.center)
                            Text(String(repeating:"★",count:max(1,numberCorrect)))
                                .font(.system(size:50)).foregroundStyle(.orange)
                                .accessibilityLabel("\(max(1,numberCorrect)) stars earned")
                            Text("Every challenge can be replayed. Great explorers listen, reflect, and learn.")
                                .font(.footnote).multilineTextAlignment(.center)
                            PawButton(title:"Return to the Polar Map",symbol:"map.fill") { dismiss() }
                            Button("Play this chapter again") { restart() }
                                .padding(.top,8).font(.headline)
                        } else {
                            HStack {
                                Text("CLUE \(questionIndex+1) OF 3")
                                    .font(.caption.bold())
                                Spacer()
                                Text(question.kind.caption)
                                    .font(.system(size:11,weight:.black))
                                    .foregroundStyle(.teal)
                            }
                            ProgressView(value:Double(questionIndex),total:3).tint(.teal)
                            Text(question.question)
                                .font(.system(.title3,design:.rounded,weight:.heavy))
                                .multilineTextAlignment(.center)
                                .fixedSize(horizontal:false,vertical:true)
                            ForEach(question.options.indices,id:\.self) { option in
                                Button {
                                    guard selected == nil else { return }
                                    selected = option
                                    if option == question.correct { numberCorrect += 1 }
                                    MammalHaptics.tap()
                                } label: {
                                    HStack(spacing:12) {
                                        Image(systemName: icon(for:option))
                                            .frame(width:27)
                                        Text(question.options[option])
                                            .frame(maxWidth:.infinity,alignment:.leading)
                                            .multilineTextAlignment(.leading)
                                        if selected != nil && option == question.correct {
                                            Image(systemName:"checkmark.seal.fill")
                                        }
                                    }
                                    .font(.system(.subheadline,design:.rounded,weight:.semibold))
                                    .foregroundStyle(.primary)
                                    .padding(13)
                                    .frame(maxWidth:.infinity,minHeight:48)
                                    .background(answerBackground(for:option),
                                                in:RoundedRectangle(cornerRadius:14))
                                }
                                .buttonStyle(.plain)
                                .disabled(selected != nil)
                                .accessibilityLabel(question.options[option])
                            }
                            if let choice = selected {
                                VStack(spacing:8) {
                                    Text(choice == question.correct ? "⭐ YOU GOT IT!" : "💡 HERE'S THE CLUE")
                                        .font(.headline)
                                    Text(question.explanation)
                                        .font(.subheadline)
                                        .fixedSize(horizontal:false,vertical:true)
                                    Text("Answer: "+question.options[question.correct])
                                        .font(.footnote.bold())
                                    PawButton(title:questionIndex == 2 ? "Finish This Chapter" : "Next Clue",
                                              symbol:"arrow.right.circle.fill") {
                                        continuePlaying()
                                    }
                                }
                                .padding(14)
                                .frame(maxWidth:.infinity)
                                .background(Color.mint.opacity(0.17),
                                            in:RoundedRectangle(cornerRadius:17))
                                .accessibilityElement(children:.contain)
                            }
                        }
                    }
                    Text("No time limit. No social competition. No ads. Your choices stay on your device.")
                        .font(.caption).foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(18)
            }
        }
        .navigationTitle(chapter.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func icon(for option: Int) -> String {
        guard let selected else { return "circle" }
        if option == question.correct { return "checkmark.circle.fill" }
        return option == selected ? "xmark.circle.fill" : "circle"
    }
    private func answerBackground(for option: Int) -> Color {
        guard let selected else { return Color.white.opacity(0.96) }
        if option == question.correct { return .green.opacity(0.24) }
        return option == selected ? .orange.opacity(0.25) : .gray.opacity(0.09)
    }
    private func continuePlaying() {
        guard selected != nil, !isComplete else { return }
        if questionIndex < 2 {
            questionIndex += 1
            selected = nil
        } else {
            isComplete = true
            onComplete(chapter.id,numberCorrect)
        }
    }
    private func restart() {
        questionIndex = 0
        selected = nil
        numberCorrect = 0
        isComplete = false
    }
}
