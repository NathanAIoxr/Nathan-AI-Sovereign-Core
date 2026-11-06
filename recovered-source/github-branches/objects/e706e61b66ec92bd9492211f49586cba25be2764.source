import SwiftUI

private struct FamilyMember: Identifiable {
    let id: String
    let emoji: String
    let story: String
}

struct FamilyView: View {
    @EnvironmentObject private var progress: MammalProgress
    private let mammals: [FamilyMember] = [
        .init(id: "Stewart (Stewie)", emoji: "🐈", story: "A black-and-white Paint-horse-patterned cat. His WHITE patches split his BLACK coat. One memorable day he climbed on Nathan's chest and made biscuits!"),
        .init(id: "Mr. Finn", emoji: "🐈‍⬛", story: "Stewie's black-and-white cat companion. His markings complement Stewie's, like two halves of a puzzle."),
        .init(id: "Champ (Fattie Bo Daddy)", emoji: "🐕", story: "A beautiful tan, long-legged hound with a round sausage-roll body. He loves food—and sometimes wants to inspect your sleeves!"),
        .init(id: "Ace", emoji: "🐶", story: "A sweet, energetic, long-haired, reddish Australian Shepherd with a white chest, fancy-feathered paws, and a very funny head tilt."),
        .init(id: "Collyn", emoji: "👨", story: "Nathan's human first cousin. He bottle-fed the two cat mammals and cares for the family."),
        .init(id: "Shawna", emoji: "❤️", story: "Collyn's girlfriend, a visiting human mammal who doesn't live here. Both cats jump in her lap and purr—much to Nathan's dramatic pretend jealousy!"),
        .init(id: "Nathan", emoji: "🧢", story: "A human mammal, the storyteller, and a devoted friend to all the mammals. He believes trust grows when your actions match your words.")
    ]

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 14) {
                    StoryHeading(title: "Meet the Mammals", subtitle: "Four furry mammals, three human mammals, one family of stories.")
                    Image("CatHeroes")
                        .resizable().scaledToFill().frame(height: 180).clipped()
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                    ForEach(mammals) { member in
                        GameCard {
                            HStack(alignment: .top, spacing: 14) {
                                Text(member.emoji).font(.system(size: 41)).frame(width: 51)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(member.id).font(.system(.headline, design: .rounded, weight: .heavy))
                                    Text(member.story).font(.system(.subheadline, design: .rounded)).fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                            }
                        }
                    }
                    GameCard {
                        Text("Your word is your bond.").font(.system(.title3, design: .rounded, weight: .black))
                        Text("Talk to them like a mammal. Then learn to speak their language. Listen and be the kind of mammal they can trust.")
                            .multilineTextAlignment(.center)
                    }
                    Text("Inspired by Nathan Tabor's real family; play and conversations are adapted for children.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(18)
            }
        }
        .navigationTitle("Mammal Family")
        .navigationBarTitleDisplayMode(.inline)
    }
}