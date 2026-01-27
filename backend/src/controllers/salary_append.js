
// Salary Structure Management
exports.createSalaryStructure = async (req, res) => {
    try {
        const newStructure = new SalaryStructure(req.body);
        await newStructure.save();
        res.status(201).json(newStructure);
    } catch (error) {
        console.error("Create Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getSalaryStructures = async (req, res) => {
    try {
        const structures = await SalaryStructure.find().sort({ minSalary: 1 });
        res.json(structures);
    } catch (error) {
        console.error("Get Structures Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateSalaryStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const structure = await SalaryStructure.findByIdAndUpdate(id, req.body, { new: true });
        if (!structure) return res.status(404).json({ message: "Structure not found" });
        res.json(structure);
    } catch (error) {
        console.error("Update Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteSalaryStructure = async (req, res) => {
    try {
        const { id } = req.params;
        await SalaryStructure.findByIdAndDelete(id);
        res.json({ message: "Structure deleted" });
    } catch (error) {
        console.error("Delete Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeSalaryDetails = async (req, res) => {
    try {
        const { empId } = req.params;
        const user = await User.findOne({ id: empId });
        if (!user) return res.status(404).json({ message: "Employee not found" });

        const package = user.package || 0;
        const monthlyGross = package / 12;

        const structure = await SalaryStructure.findOne({
            minSalary: { $lte: package },
            maxSalary: { $gte: package }
        });

        let breakdown = {
            basicSalary: 0,
            earnings: [],
            deductions: [],
            netPay: 0,
            package: package
        };

        if (structure) {
            let basicSalary = 0;

            // Calculate Basic
            const basicRule = structure.earnings.find(e => e.label.toLowerCase().includes('basic'));
            if (basicRule) {
                if (basicRule.type === 'Percentage') {
                    basicSalary = (monthlyGross * basicRule.value) / 100;
                } else {
                    basicSalary = basicRule.value;
                }
            } else {
                basicSalary = monthlyGross * 0.5;
            }
            breakdown.basicSalary = Math.round(basicSalary);

            // Calculate Earnings
            structure.earnings.forEach(rule => {
                let amount = 0;
                // If label is Basic Salary, we already calc'd it, but let's push it formatted
                // Careful not to double count if we just want to show list

                const base = rule.baseComponent === 'Basic' ? basicSalary : monthlyGross;

                if (rule.type === 'Percentage') {
                    amount = (base * rule.value) / 100;
                } else {
                    amount = rule.value;
                }

                breakdown.earnings.push({
                    label: rule.label,
                    amount: Math.round(amount)
                });
            });

            // Calculate Deductions
            structure.deductions.forEach(rule => {
                let amount = 0;
                const base = rule.baseComponent === 'Basic' ? basicSalary : monthlyGross;

                if (rule.type === 'Percentage') {
                    amount = (base * rule.value) / 100;
                } else {
                    amount = rule.value;
                }
                breakdown.deductions.push({
                    label: rule.label,
                    amount: Math.round(amount)
                });
            });

        } else {
            // Fallback default
            breakdown.basicSalary = Math.round(monthlyGross * 0.5);
            breakdown.earnings.push({ label: 'Basic Salary', amount: breakdown.basicSalary });
        }

        // Calculate Net Pay
        const totalEarnings = breakdown.earnings.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = breakdown.deductions.reduce((sum, item) => sum + item.amount, 0);
        breakdown.netPay = totalEarnings - totalDeductions;

        res.json(breakdown);

    } catch (error) {
        console.error("Get Emp Salary Details Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
