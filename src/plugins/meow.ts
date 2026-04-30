export class Meow {
  name = "meow";
  private msgs = [
    "mreow",
    "mrrp",
    "meow",
    "miao",
    "miaow",
    "prrt",
    "brrt",
    "meooow",
    "miaaaaow",
    "rawr",
    "purrr",
    "nyan",
    "miau",
    "miaou",
    "mjau",
    "myau",
    "niau",
    "MEOEW",
    "MEOW",
    "mrrm",
    "nya",
  ];
  init() {
    const msg = this.msgs[Math.floor(Math.random() * this.msgs.length)];
    return msg;
  }
}