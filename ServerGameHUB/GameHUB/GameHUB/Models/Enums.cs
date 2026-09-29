namespace GameHUB.Models;

public enum Tier { MustPlay, MightPlay, NotToday, Meh, Curious, Reluctant, HardNo }

public enum SessionStatus { GATHERING, READY, IN_PROGRESS, COMPLETED, CANCELLED }

public enum ParticipantStatus { INVITED, ACCEPTED, DECLINED, JOINED, NO_SHOW }