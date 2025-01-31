import express from "express";
import MyError from "../utils/myError";
import { User } from "../db/Users";
import Wallet from "../db/Wallet";
/**
 * @author tushig
 */

export const dashboard = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    // Step 1: Aggregate Wallet Data
    const walletAggregation = await Wallet.aggregate<{
      _id: boolean;
      totalAmount: number;
    }>([
      {
        $group: {
          _id: "$isPayment", // Group by isPayment
          totalAmount: { $sum: "$amount" }, // Sum the amounts for payments
        },
      },
    ]);

    // Extract totalAmount for isPayment: true
    const totalAmount =
      walletAggregation.find((wallet) => wallet._id === true)?.totalAmount || 0;

    // Step 2: Aggregate User and Wallet Data
    const userAggregation = await User.aggregate<{
      _id: string;
      totalPaid: number;
      totalUnpaid: number;
    }>([
      {
        $lookup: {
          from: "wallets", // The Wallet collection name
          localField: "_id", // Link User's _id
          foreignField: "user", // To Wallet's user field
          as: "wallets", // Alias for joined wallets
        },
      },
      {
        $addFields: {
          isPaid: {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$wallets" }, 0] }, // Check if user has wallets
                  { $eq: [{ $arrayElemAt: ["$wallets.isPayment", 0] }, true] }, // Check isPayment
                ],
              },
              true,
              false,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$level", // Group by level (e.g., Бага, Дунд, Ахлах)
          totalPaid: { $sum: { $cond: ["$isPaid", 1, 0] } }, // Count paid users
          totalUnpaid: { $sum: { $cond: ["$isPaid", 0, 1] } }, // Count unpaid users
        },
      },
    ]);

    // Step 3: Organize Results by Level
    const levelData: Record<string, { paid: number; unpaid: number }> = {
      "Бага(3-5-р анги)": { paid: 0, unpaid: 0 },
      "Дунд(6-9-р анги)": { paid: 0, unpaid: 0 },
      "Ахлах(10-12-р анги)": { paid: 0, unpaid: 0 },
    };

    userAggregation.forEach((item) => {
      if (levelData[item._id]) {
        levelData[item._id].paid = item.totalPaid;
        levelData[item._id].unpaid = item.totalUnpaid;
      }
    });
    const successPayment =
      levelData["Бага(3-5-р анги)"].paid +
      levelData["Дунд(6-9-р анги)"].paid +
      levelData["Ахлах(10-12-р анги)"].paid;
    const unsuccessPayment =
      levelData["Бага(3-5-р анги)"].unpaid +
      levelData["Дунд(6-9-р анги)"].unpaid +
      levelData["Ахлах(10-12-р анги)"].unpaid;

    // Step 4: Send Response
    res.status(200).json({
      level1: levelData["Бага(3-5-р анги)"].paid,
      level2: levelData["Дунд(6-9-р анги)"].paid,
      level3: levelData["Ахлах(10-12-р анги)"].paid,
      level1unpayment: levelData["Бага(3-5-р анги)"].unpaid,
      level2unpayment: levelData["Дунд(6-9-р анги)"].unpaid,
      level3unpayment: levelData["Ахлах(10-12-р анги)"].unpaid,
      totalAmount,
      successPayment,
      unsuccessPayment,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Серверийн алдаа гарлаа." });
  }
};

export const chartDashboard = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const lessons = [
      "Математик",
      "Монгол хэл, бичиг, уран зохиол",
      "Англи хэл",
      "Орос хэл",
      "Түүх",
      "Нийгмийн ухаан",
      "Байгалийн ухаан",
      "Газар зүй",
      "Хими",
      "Физик",
      "Биологи",
    ];

    // Perform aggregation to count lessons
    const lessonStats = await User.aggregate([
      {
        $group: {
          _id: "$lesson", // Group by the `lesson` field
          count: { $sum: 1 }, // Count the occurrences
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id", // Map `_id` to `label`
          value: "$count", // Map `count` to `value`
        },
      },
    ]);

    // Ensure all lessons are included, even those with zero counts
    const response = lessons.map((lesson) => {
      const stat = lessonStats.find((s) => s.label === lesson);
      return { label: lesson, value: stat ? stat.value : 0 };
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching lesson stats:", error);
    res.status(500).json({ message: "Серверийн алдаа гарлаа." });
  }
};

export const downloadUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    let query: any = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate)
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    // Fetch users and populate wallet details
    const users = await User.find(query).populate("wallet");

    res.status(200).json(users).end();
  } catch (error) {
    throw new MyError("Серверийн алдаа!", 500);
  }
};
