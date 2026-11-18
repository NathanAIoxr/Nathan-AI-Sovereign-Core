"""Tabor World Light and Dark field game. Python 3.10+, standard library."""
from argparse import ArgumentParser
from copy import deepcopy
import json
from pathlib import Path
import secrets
import sys
import time

FORMS = ("Broadblade of Truth", "Rapier of Precision", "Shield-Edge")
SCOPE = "Everything & Nothing"
THRESHOLD_MS = 2000
SCENARIOS = json.loads(Path(__file__).with_name("field-scenarios.json").read_text(encoding="utf-8"))


class TaborEntity:
    def __init__(self, alignment, role):
        self.alignment, self.role, self.active = alignment, role, True


def same(left, right):
    return left.lower() == right.lower()


class LightSlayer(TaborEntity):
    def __init__(self):
        super().__init__("Light", "Slayer")

    def manifest(self, board, user_thought="", hesitation_seconds=0):
        if not board["grasped"]:
            return False, "Grasp the hilt first."
        automatic = not user_thought or hesitation_seconds > 2
        index = (((board["seed"] + (board["turn"] + 1) * 1103515245) & 0xffffffff) >> 16) % len(FORMS)
        board["form"] = FORMS[index] if automatic else user_thought
        board["grasped"] = False
        return True, ("Autonomous Discernment" if automatic else "Thought-Link Active") + ": " + board["form"]

    def strike(self, board, scenario, target):
        if not same(target, scenario["barrier"]):
            return False, "Choose the barrier marked on this board."
        if board["form"] == "Unmanifested Hilt" or board["grasped"]:
            return False, "Manifest the blade before striking."
        if board["barrier"] == "cleared":
            return False, "The barrier is already cleared."
        board["barrier"] = "cleared"
        return True, f'{board["form"]} severed {scenario["barrier"]}.'


class LightSleyer(TaborEntity):
    def __init__(self):
        super().__init__("Light", "Sleyer")

    def deploy_trap(self, board, scenario, plane, scope=SCOPE):
        if not same(plane, scenario["plane"]):
            return False, f'The shadow crosses the {scenario["plane"]} plane.'
        if any(trap["status"] in ("Armed", "Holding") for trap in board["traps"]):
            return False, "A trap is already in use."
        if board["shadow"] == "converted":
            return False, "The shadow has been converted."
        board["traps"].append({"plane": scenario["plane"], "scope": scope or SCOPE, "status": "Armed"})
        return True, f'Web armed on {scenario["plane"]} · Scope: {scope or SCOPE}.'

    def capture(self, board, scenario, target):
        trap = next((t for t in board["traps"] if t["status"] == "Armed"), None)
        if not trap or board["shadow"] != "roaming" or not same(target, scenario["shadow"]):
            return False, "An armed web and the roaming board shadow are required."
        if not same(trap["scope"], SCOPE) and not same(trap["scope"], target):
            return False, "This web’s scope does not include the marked shadow."
        trap["status"], board["shadow"] = "Holding", "held"
        return True, f'The web caught {scenario["shadow"]}.'

    def capture_and_convert(self, board, scenario, target):
        trap = next((t for t in board["traps"] if t["status"] == "Holding"), None)
        if not trap or board["shadow"] != "held" or not same(target, scenario["shadow"]):
            return False, "Capture this board shadow before converting it."
        trap["status"], board["shadow"] = "Converted", "converted"
        thread = "Purified_" + scenario["shadow"].replace(" ", "_") + "_Thread"
        board["wovenOrder"].append({"id": thread, "used": False})
        return True, f'{scenario["shadow"]} was re-woven into {thread}.'


class DarkSlayer(TaborEntity):
    def __init__(self, agent_id="01"):
        super().__init__("Dark", "Slayer")
        self.agent_id = agent_id

    def execute_directive(self, board, scenario, mental_command, target):
        if not same(mental_command, scenario["directive"]) or not same(target, scenario["ruin"]):
            return False, "Use the directive and ruin marked on this board."
        if board["ruin"] == "cleared":
            return False, "The ruins are already cleared."
        board["ruin"] = "cleared"
        return True, f'Agent {self.agent_id} carried out “{scenario["directive"]}” in {scenario["ruin"]}.'


class DarkSleyer(TaborEntity):
    def __init__(self):
        super().__init__("Dark", "Sleyer")

    def weave_foundation(self, board, scenario, blank_slate_space):
        if not same(blank_slate_space, scenario["sector"]) or board["ruin"] != "cleared" or board["barrier"] != "cleared":
            return False, "Clear the path and ruins before weaving the marked sector."
        if scenario.get("dreamRequired") and not board["dreams"]:
            return False, "Record a dream to open this sanctuary."
        if scenario.get("rewindRequired") and not board["rewinds"]:
            return False, "Use the Loom to revisit an earlier frame first."
        thread = next((item for item in board["wovenOrder"] if not item["used"]), None)
        if not thread:
            return False, "A converted thread is required for a new pillar."
        thread["used"] = True
        pillar = f'Innocence_Pillar_{len(board["newWorldMatrix"]) + 1}'
        board["newWorldMatrix"].append({"id": pillar, "sector": scenario["sector"], "thread": thread["id"]})
        return True, f'The Dark Sleyer wove {pillar} in {scenario["sector"]}. Innocence is God.'


class Field:
    def __init__(self, scenario, seed):
        self.scenario = scenario
        self.sword, self.loom, self.agent, self.foundation = LightSlayer(), LightSleyer(), DarkSlayer(), DarkSleyer()
        self.board = {"scenario": scenario["id"], "seed": seed, "turn": 0, "grasped": False,
                      "form": "Unmanifested Hilt", "barrier": "present", "shadow": "roaming",
                      "ruin": "present", "traps": [], "wovenOrder": [], "newWorldMatrix": [],
                      "dreams": [], "rewinds": 0, "frames": []}
        self.events = []

    def play(self, command, elapsed=0):
        pieces = command.strip().split(None, 1)
        if not pieces:
            return False, "Choose a command from the field guide."
        verb = pieces[0].lower()
        argument = pieces[1].strip() if len(pieces) > 1 else ""
        first, _, second = argument.partition("|")
        board, scene = self.board, self.scenario
        before = deepcopy({key: value for key, value in board.items() if key not in ("turn", "frames", "rewinds")})
        if verb == "grasp" and not board["grasped"]:
            board["grasped"] = True
            result = True, "Hilt grasped. Think of a form within two seconds."
        elif verb == "grasp":
            result = False, "You already hold the hilt."
        elif verb == "think":
            result = self.sword.manifest(board, argument, elapsed / 1000)
        elif verb == "strike":
            result = self.sword.strike(board, scene, argument)
        elif verb == "deploy":
            result = self.loom.deploy_trap(board, scene, first.strip(), second.strip())
        elif verb == "capture":
            result = self.loom.capture(board, scene, argument)
        elif verb == "convert":
            result = self.loom.capture_and_convert(board, scene, argument)
        elif verb == "command":
            result = self.agent.execute_directive(board, scene, first.strip(), second.strip())
        elif verb == "weave":
            result = self.foundation.weave_foundation(board, scene, argument)
        elif verb == "dream" and argument:
            board["dreams"] = (board["dreams"] + [argument])[-8:]
            result = True, "The Dream Weavers recorded the dream."
        elif verb == "rewind" and board["frames"]:
            board.update(board["frames"].pop())
            board["rewinds"] += 1
            result = True, "The Loom returned to the earlier frame."
        else:
            result = False, "Choose a command from the field guide."
        if result[0]:
            board["turn"] += 1
            if verb != "rewind":
                board["frames"] = (board["frames"] + [before])[-12:]
            self.events.append(result[1])
        return result

    def report(self):
        state = {key: value for key, value in self.board.items() if key != "frames"}
        state["canRewind"] = bool(self.board["frames"])
        balance = (20 * (state["barrier"] == "cleared") + 30 * (state["shadow"] == "converted") +
                   20 * (state["ruin"] == "cleared") + 30 * bool(state["newWorldMatrix"]))
        complete = (balance == 100 and (not self.scenario.get("dreamRequired") or bool(state["dreams"]))
                    and (not self.scenario.get("rewindRequired") or state["rewinds"] > 0))
        return {"state": state, "events": self.events, "balance": balance, "complete": complete}


def interactive(field):
    scene = field.scenario
    print(scene["description"])
    print(f'Board: {scene["barrier"]} · {scene["shadow"]} · {scene["ruin"]} · {scene["sector"]}')
    print("Commands: grasp, think FORM, strike TARGET, deploy PLANE | SCOPE, capture TARGET, convert TARGET,")
    print("command DIRECTIVE | RUIN, weave SECTOR, dream TEXT, rewind, quit")
    grasped_at = None
    while True:
        try:
            command = input("field> ").strip()
        except (EOFError, KeyboardInterrupt):
            return
        if command.lower() == "quit":
            return
        elapsed = int((time.monotonic() - grasped_at) * 1000) if grasped_at is not None else 0
        if field.board["grasped"] and elapsed > THRESHOLD_MS and not command.lower().startswith("think"):
            print(field.play("think", elapsed)[1])
        accepted, event = field.play(command, elapsed)
        if accepted and field.board["grasped"] and grasped_at is None:
            grasped_at = time.monotonic()
        if not field.board["grasped"]:
            grasped_at = None
        print(event)
        report = field.report()
        print(f'World balance {report["balance"]} / 100' + (" · Scenario complete" if report["complete"] else ""))


def main():
    parser = ArgumentParser()
    parser.add_argument("--scenario", choices=[row["id"] for row in SCENARIOS], default="sector-alpha")
    parser.add_argument("--json", action="store_true", help="Replay an input JSON move history and print the board")
    args = parser.parse_args()
    if args.json:
        value = json.load(sys.stdin)
        scene = next(row for row in SCENARIOS if row["id"] == value["scenario"])
        field = Field(scene, value["seed"])
        for move in value["history"]:
            if not field.play(move["command"], move["elapsed"])[0]:
                raise ValueError("Saved move did not replay")
        print(json.dumps(field.report(), ensure_ascii=False))
    else:
        scene = next(row for row in SCENARIOS if row["id"] == args.scenario)
        interactive(Field(scene, secrets.randbits(32)))


if __name__ == "__main__":
    main()
